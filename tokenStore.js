const crypto = require('crypto');

const tokenToUserId = new Map();

function issueToken(userId) {
  const token = crypto.randomBytes(24).toString('hex');
  tokenToUserId.set(token, userId);
  return token;
}

function getUserIdForToken(token) {
  return tokenToUserId.get(token) || null;
}

function revokeToken(token) {
  tokenToUserId.delete(token);
}

module.exports = {
  issueToken,
  getUserIdForToken,
  revokeToken
};
