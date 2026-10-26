const { User } = require('../models');
const ACCOUNT_TYPES = require('../utils/accountTypes');

async function listPendingAccounts(req, res) {
  const pendingAccounts = await User.findAll({
    where: {
      isApproved: false,
      accountType: [ACCOUNT_TYPES.DONOR, ACCOUNT_TYPES.SOCIETY, ACCOUNT_TYPES.RIDER]
    },
    order: [['createdAt', 'ASC']],
    attributes: ['id', 'fullName', 'email', 'accountType', 'city', 'bloodGroup', 'phoneNumber', 'vehicleInfo', 'createdAt']
  });

  res.json({ pendingAccounts });
}

async function listAllAccounts(req, res) {
  const accounts = await User.findAll({
    where: {
      accountType: [ACCOUNT_TYPES.DONOR, ACCOUNT_TYPES.SOCIETY, ACCOUNT_TYPES.RIDER]
    },
    order: [['createdAt', 'DESC']],
    attributes: ['id', 'fullName', 'email', 'accountType', 'city', 'isApproved', 'createdAt']
  });

  res.json({ accounts });
}

async function approveAccount(req, res) {
  const accountId = req.params.id;

  const account = await User.findByPk(accountId);
  if (!account || account.accountType === ACCOUNT_TYPES.ADMIN) {
    return res.status(404).json({ error: 'Account not found.' });
  }

  account.isApproved = true;
  await account.save();

  res.json({ message: 'Account approved.' });
}

async function rejectAccount(req, res) {
  const accountId = req.params.id;

  const account = await User.findByPk(accountId);
  if (!account || account.accountType === ACCOUNT_TYPES.ADMIN) {
    return res.status(404).json({ error: 'Account not found.' });
  }

  await account.destroy();

  res.json({ message: 'Account rejected and removed.' });
}

module.exports = {
  listPendingAccounts,
  listAllAccounts,
  approveAccount,
  rejectAccount
};
