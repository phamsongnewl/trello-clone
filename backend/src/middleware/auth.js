const jwt = require('jsonwebtoken');
const { User } = require('../models/index');

/**
 * Authentication middleware.
 * Reads JWT from the `token` httpOnly cookie, verifies it,
 * fetches the User row, and attaches it to req.user.
 * Responds with 401 when the token is absent or invalid.
 */
async function auth(req, res, next) {
  try {
    const token = req.cookies && req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password_hash'] },
    });

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = auth;