import User from '../models/User.js';

// Usage: authorizeRoles('admin', 'property_manager')
export const authorizeRoles = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      // authenticateToken must run before this and set req.user.userId
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Fetch user (cache on req to avoid multiple lookups per request)
      const user = req.authUser || await User.findById(userId).select('role isActive');
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }
      req.authUser = user;

      if (!user.isActive) {
        return res.status(403).json({ error: 'Account is deactivated' });
      }

      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({ error: 'Forbidden: insufficient privileges' });
      }

      return next();
    } catch (err) {
      return next(err);
    }
  };
};

export default { authorizeRoles };
