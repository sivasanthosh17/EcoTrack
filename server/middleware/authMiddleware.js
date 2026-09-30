import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Protect middleware: Verifies JWT token and attaches user object to request
 */
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Extract token from header: "Bearer <token>"
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'ecotrack_super_secret_jwt_key_2026'
      );

      // Fetch user details from database excluding password
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          status: 'error',
          message: 'User account no longer exists.'
        });
      }

      next();
    } catch (error) {
      console.error('[Auth Middleware Error]', error.message);
      return res.status(401).json({
        status: 'error',
        message: 'Not authorized, token invalid or expired.'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'Not authorized, no access token provided.'
    });
  }
};

/**
 * Authorize middleware: Enforces Role-Based Access Control (RBAC)
 * @param  {...string} roles - Allowed user roles
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: `Access denied. Role '${req.user?.role || 'Guest'}' is not authorized to perform this action.`
      });
    }
    next();
  };
};

export const enforceDepartmentScope = (req, res, next) => {
  if (req.user?.role === 'Organization Admin') {
    return next();
  }

  const requestedDepartment = req.body?.department || req.query?.department;

  if (requestedDepartment && requestedDepartment !== req.user?.department) {
    return res.status(403).json({
      status: 'error',
      message: 'Access denied. You can only access records for your department.'
    });
  }

  if (req.method === 'GET' && req.query) {
    req.query.department = req.user.department;
  }

  next();
};

export const canAccessDepartment = (user, department) => (
  user?.role === 'Organization Admin' || user?.department === department
);
