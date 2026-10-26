const { User, BloodRequest, EmergencyResponse } = require('../models');
const ACCOUNT_TYPES = require('../utils/accountTypes');

async function createBloodRequest(req, res) {
  const loggedInUser = await User.findByPk(req.userId);

  if (!loggedInUser || loggedInUser.accountType !== ACCOUNT_TYPES.SOCIETY) {
    return res.status(403).json({ error: 'Only society accounts can post a blood request.' });
  }

  const { bloodGroup, city, unitsNeeded, notes, isEmergency } = req.body;

  if (!bloodGroup || !city || !unitsNeeded) {
    return res.status(400).json({ error: 'Please fill in all required fields.' });
  }

  await BloodRequest.create({
    bloodGroup,
    city,
    unitsNeeded,
    notes: notes || null,
    isEmergency: Boolean(isEmergency),
    requestedBySocietyId: loggedInUser.id
  });

  res.status(201).json({ message: 'Blood request posted successfully.' });
}

async function respondToEmergency(req, res) {
  const donor = await User.findByPk(req.userId);

  if (!donor || donor.accountType !== ACCOUNT_TYPES.DONOR) {
    return res.status(403).json({ error: 'Only donor accounts can respond to an emergency request.' });
  }

  const bloodRequest = await BloodRequest.findByPk(req.params.id);
  if (!bloodRequest || !bloodRequest.isEmergency) {
    return res.status(404).json({ error: 'Emergency request not found.' });
  }

  const existingResponse = await EmergencyResponse.findOne({
    where: { bloodRequestId: bloodRequest.id, donorId: donor.id }
  });

  if (existingResponse) {
    return res.status(409).json({ error: 'You have already responded to this request.' });
  }

  await EmergencyResponse.create({
    bloodRequestId: bloodRequest.id,
    donorId: donor.id
  });

  res.status(201).json({ message: 'Thank you! The society has been notified that you can help.' });
}

async function markRequestFulfilled(req, res) {
  const society = await User.findByPk(req.userId);
  const bloodRequest = await BloodRequest.findByPk(req.params.id);

  if (!bloodRequest) {
    return res.status(404).json({ error: 'Blood request not found.' });
  }

  if (!society || bloodRequest.requestedBySocietyId !== society.id) {
    return res.status(403).json({ error: 'You can only update your own requests.' });
  }

  bloodRequest.isFulfilled = true;
  await bloodRequest.save();

  res.json({ message: 'Marked as fulfilled.' });
}

async function getEmergencyResponders(req, res) {
  const society = await User.findByPk(req.userId);
  const bloodRequest = await BloodRequest.findByPk(req.params.id);

  if (!bloodRequest) {
    return res.status(404).json({ error: 'Blood request not found.' });
  }

  if (!society || bloodRequest.requestedBySocietyId !== society.id) {
    return res.status(403).json({ error: 'You can only view responders for your own requests.' });
  }

  const responses = await EmergencyResponse.findAll({
    where: { bloodRequestId: bloodRequest.id },
    order: [['createdAt', 'ASC']],
    include: [{ model: User, as: 'donor', attributes: ['fullName', 'email', 'phoneNumber', 'bloodGroup'] }]
  });

  res.json({ responders: responses });
}

module.exports = {
  createBloodRequest,
  respondToEmergency,
  markRequestFulfilled,
  getEmergencyResponders
};
