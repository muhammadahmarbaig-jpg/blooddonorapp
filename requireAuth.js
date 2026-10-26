const { getUserIdForToken } = require('../utils/tokenStore');

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Not logged in.' });
  }

  const userId = getUserIdForToken(token);
  if (!userId) {
    return res.status(401).json({ error: 'Session expired, please log in again.' });
  }

  req.userId = userId;
  next();
}

module.exports = requireAuth;
