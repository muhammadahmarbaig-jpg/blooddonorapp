const { User } = require('../models');
const ACCOUNT_TYPES = require('../utils/accountTypes');

async function requireAdmin(req, res, next) {
  const user = await User.findByPk(req.userId);

  if (!user || user.accountType !== ACCOUNT_TYPES.ADMIN) {
    return res.status(403).json({ error: 'Admin access only.' });
  }

  req.adminUser = user;
  next();
}

module.exports = requireAdmin;
