const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'freshharvest-secret-key-2026';

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }
    const userRole = req.user.role;
    if (!roles.includes(userRole)) {
      return res.status(403).json({
        message: `Forbidden: requires one of the following roles: [${roles.join(', ')}]. Current role: ${userRole || 'none'}`
      });
    }
    next();
  };
}

module.exports = { authMiddleware, requireRole, JWT_SECRET };
