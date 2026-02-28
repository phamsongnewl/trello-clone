/**
 * Global error-handling middleware.
 * Must be the last middleware registered (after all routes).
 *
 * Handled cases:
 *  - Sequelize UniqueConstraintError  → 409 Conflict
 *  - JsonWebTokenError / TokenExpiredError → 401 Unauthorized
 *  - Everything else                  → 500 Internal Server Error
 */
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  console.error('[ErrorHandler]', err.name, err.message);

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      message: 'A record with that value already exists',
      fields: err.fields,
    });
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  return res.status(500).json({ message: 'Internal server error' });
}

module.exports = errorHandler;
