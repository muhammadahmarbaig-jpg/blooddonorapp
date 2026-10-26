const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { User, BloodRequest } = require('../models');
const calculateDonationEligibility = require('../utils/donationEligibility');
const { issueToken, revokeToken } = require('../utils/tokenStore');
const ACCOUNT_TYPES = require('../utils/accountTypes');

async function getPublicStats(req, res) {
  const donorCount = await User.count({ where: { accountType: ACCOUNT_TYPES.DONOR, isApproved: true } });
  const societyCount = await User.count({ where: { accountType: ACCOUNT_TYPES.SOCIETY, isApproved: true } });

  res.json({ donorCount, societyCount });
}

async function getSocietyList(req, res) {
  const societyList = await User.findAll({
    where: { accountType: ACCOUNT_TYPES.SOCIETY, isApproved: true },
    order: [['fullName', 'ASC']],
    attributes: ['id', 'fullName']
  });

  res.json({ societyList });
}

async function registerDonor(req, res) {
  const { fullName, email, password, bloodGroup, city, lastDonationDate, attachedSocietyId, phoneNumber } = req.body;

  if (!fullName || !email || !password || !bloodGroup || !city) {
    return res.status(400).json({ error: 'Please fill in all required fields.' });
  }

  const existingEmail = await User.findOne({ where: { email } });
  if (existingEmail) {
    return res.status(409).json({ error: 'This email is already registered.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      fullName,
      email,
      password: hashedPassword,
      accountType: ACCOUNT_TYPES.DONOR,
      isApproved: false,
      bloodGroup,
      city,
      lastDonationDate: lastDonationDate || null,
      attachedSocietyId: attachedSocietyId || null,
      phoneNumber: phoneNumber || null
    });

    res.status(201).json({ message: 'Account created. An admin needs to approve it before you can log in.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong while creating your account. Please try again.' });
  }
}

async function registerSociety(req, res) {
  const { fullName, email, password, city } = req.body;

  if (!fullName || !email || !password || !city) {
    return res.status(400).json({ error: 'Please fill in all required fields.' });
  }

  const existingEmail = await User.findOne({ where: { email } });
  if (existingEmail) {
    return res.status(409).json({ error: 'This email is already registered.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      fullName,
      email,
      password: hashedPassword,
      accountType: ACCOUNT_TYPES.SOCIETY,
      isApproved: false,
      city
    });

    res.status(201).json({ message: 'Account created. An admin needs to approve it before you can log in.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong while creating your account. Please try again.' });
  }
}

async function registerRider(req, res) {
  const { fullName, email, password, city, phoneNumber, vehicleInfo } = req.body;

  if (!fullName || !email || !password || !city || !phoneNumber) {
    return res.status(400).json({ error: 'Please fill in all required fields.' });
  }

  const existingEmail = await User.findOne({ where: { email } });
  if (existingEmail) {
    return res.status(409).json({ error: 'This email is already registered.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      fullName,
      email,
      password: hashedPassword,
      accountType: ACCOUNT_TYPES.RIDER,
      isApproved: false,
      city,
      phoneNumber,
      vehicleInfo: vehicleInfo || null
    });

    res.status(201).json({ message: 'Account created. An admin needs to approve it before you can log in.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong while creating your account. Please try again.' });
  }
}

async function loginUser(req, res) {
  const { email, password } = req.body;

  const user = await User.findOne({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const passwordMatches = await bcrypt.compare(password, user.password);
  if (!passwordMatches) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  if (!user.isApproved) {
    return res.status(403).json({ error: 'Your account is pending admin approval.' });
  }

  const token = issueToken(user.id);

  res.json({
    token,
    user: {
      id: user.id,
      fullName: user.fullName,
      accountType: user.accountType
    }
  });
}

function logoutUser(req, res) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (token) {
    revokeToken(token);
  }

  res.json({ message: 'Logged out.' });
}

async function getHomeData(req, res) {
  const user = await User.findByPk(req.userId);

  let ownEligibility = null;
  let attachedDonorsCount = null;
  let emergencyAlerts = null;

  if (user.accountType === ACCOUNT_TYPES.DONOR) {
    ownEligibility = calculateDonationEligibility(user.lastDonationDate);

    emergencyAlerts = await BloodRequest.findAll({
      where: { isEmergency: true, isFulfilled: false },
      order: [['createdAt', 'DESC']],
      limit: 5,
      include: [{ model: User, as: 'requestedBySociety', attributes: ['fullName'] }]
    });
  } else if (user.accountType === ACCOUNT_TYPES.SOCIETY) {
    attachedDonorsCount = await User.count({ where: { attachedSocietyId: user.id } });
  }

  res.json({
    user: publicUserFields(user),
    ownEligibility,
    attachedDonorsCount,
    emergencyAlerts
  });
}

async function getProfileData(req, res) {
  const user = await User.findByPk(req.userId, {
    include: [{ model: User, as: 'attachedSociety' }]
  });

  let ownEligibility = null;
  if (user.accountType === ACCOUNT_TYPES.DONOR) {
    ownEligibility = calculateDonationEligibility(user.lastDonationDate);
  }

  const userInfo = publicUserFields(user);
  userInfo.attachedSociety = user.attachedSociety
    ? { id: user.attachedSociety.id, fullName: user.attachedSociety.fullName }
    : null;

  res.json({ user: userInfo, ownEligibility });
}

async function updateProfile(req, res) {
  const user = await User.findByPk(req.userId);

  if (!user) {
    return res.status(404).json({ error: 'Account not found.' });
  }

  const { fullName, city, bloodGroup, lastDonationDate, phoneNumber, vehicleInfo } = req.body;

  if (!fullName || !city) {
    return res.status(400).json({ error: 'Full name and city are required.' });
  }

  user.fullName = fullName;
  user.city = city;

  if (user.accountType === ACCOUNT_TYPES.DONOR) {
    if (!bloodGroup) {
      return res.status(400).json({ error: 'Blood group is required.' });
    }
    user.bloodGroup = bloodGroup;
    user.lastDonationDate = lastDonationDate || null;
    user.phoneNumber = phoneNumber || null;
  }

  if (user.accountType === ACCOUNT_TYPES.RIDER) {
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required.' });
    }
    user.phoneNumber = phoneNumber;
    user.vehicleInfo = vehicleInfo || null;
  }

  await user.save();

  res.json({ message: 'Profile updated successfully.', user: publicUserFields(user) });
}

async function searchDonors(req, res) {
  const searchedBloodGroup = req.query.bloodGroup || '';
  const searchedCity = req.query.city || '';

  const donorSearchFilters = { accountType: ACCOUNT_TYPES.DONOR, isApproved: true };
  if (searchedBloodGroup) {
    donorSearchFilters.bloodGroup = searchedBloodGroup;
  }
  if (searchedCity) {
    donorSearchFilters.city = { [Op.like]: `%${searchedCity}%` };
  }

  const donorRecords = await User.findAll({
    where: donorSearchFilters,
    order: [['fullName', 'ASC']]
  });
  const donorList = donorRecords.map(attachEligibilityInfo);

  res.json({
    donorList,
    filters: { bloodGroup: searchedBloodGroup, city: searchedCity }
  });
}

async function getBloodRequestsData(req, res) {
  const user = await User.findByPk(req.userId);

  if (user.accountType === ACCOUNT_TYPES.DONOR) {
    const matchingBloodRequests = await BloodRequest.findAll({
      where: { bloodGroup: user.bloodGroup },
      order: [['createdAt', 'DESC']],
      include: [{ model: User, as: 'requestedBySociety', attributes: ['fullName'] }]
    });
    return res.json({ accountType: user.accountType, matchingBloodRequests });
  }

  const postedBloodRequests = await BloodRequest.findAll({
    where: { requestedBySocietyId: user.id },
    order: [['createdAt', 'DESC']]
  });
  res.json({ accountType: user.accountType, postedBloodRequests });
}

async function getSocietyDonorsData(req, res) {
  const user = await User.findByPk(req.userId);

  if (user.accountType !== ACCOUNT_TYPES.SOCIETY) {
    return res.status(403).json({ error: 'Only society accounts can view this.' });
  }

  const attachedDonorRecords = await User.findAll({
    where: { attachedSocietyId: user.id },
    order: [['fullName', 'ASC']]
  });
  const attachedDonorList = attachedDonorRecords.map(attachEligibilityInfo);

  res.json({
    bloodBagsCollected: user.bloodBagsCollected,
    attachedDonorList
  });
}

async function addBloodBag(req, res) {
  const user = await User.findByPk(req.userId);

  if (!user || user.accountType !== ACCOUNT_TYPES.SOCIETY) {
    return res.status(403).json({ error: 'Only society accounts can do this.' });
  }

  user.bloodBagsCollected = user.bloodBagsCollected + 1;
  await user.save();

  res.json({ bloodBagsCollected: user.bloodBagsCollected });
}

async function requestPasswordReset(req, res) {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Please enter your email.' });
  }

  const user = await User.findOne({ where: { email } });

  if (!user) {
    return res.json({ message: 'If that email is registered, a reset link has been generated below.' });
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);

  user.resetToken = resetToken;
  user.resetTokenExpiresAt = oneHourFromNow;
  await user.save();

  res.json({
    message: 'If that email is registered, a reset link has been generated below.',
    resetToken
  });
}

async function resetPassword(req, res) {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Please provide the reset token and a new password.' });
  }

  const user = await User.findOne({ where: { resetToken: token } });

  if (!user || !user.resetTokenExpiresAt || user.resetTokenExpiresAt < new Date()) {
    return res.status(400).json({ error: 'This reset link is invalid or has expired.' });
  }

  user.password = await bcrypt.hash(newPassword, 10);
  user.resetToken = null;
  user.resetTokenExpiresAt = null;
  await user.save();

  res.json({ message: 'Password updated. You can now log in with your new password.' });
}

function publicUserFields(user) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    city: user.city,
    accountType: user.accountType,
    isApproved: user.isApproved,
    bloodGroup: user.bloodGroup,
    lastDonationDate: user.lastDonationDate,
    bloodBagsCollected: user.bloodBagsCollected,
    phoneNumber: user.phoneNumber,
    vehicleInfo: user.vehicleInfo
  };
}

function attachEligibilityInfo(donorRecord) {
  const donorInfo = donorRecord.get({ plain: true });
  const eligibility = calculateDonationEligibility(donorInfo.lastDonationDate);
  donorInfo.isEligibleToDonate = eligibility.isEligible;
  donorInfo.daysUntilEligible = eligibility.daysRemaining;
  return donorInfo;
}

module.exports = {
  getPublicStats,
  getSocietyList,
  registerDonor,
  registerSociety,
  registerRider,
  loginUser,
  logoutUser,
  getHomeData,
  getProfileData,
  updateProfile,
  searchDonors,
  getBloodRequestsData,
  getSocietyDonorsData,
  addBloodBag,
  requestPasswordReset,
  resetPassword
};
