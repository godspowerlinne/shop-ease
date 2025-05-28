const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/dotEnvConfig');

/**
 * Protect routes - Verify JWT token and attach user to request
 */
exports.protect = async (req, res, next) => {
  try {
    let token;
    
    // Check if token exists in headers
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this resource'
      });
    }
    
    try {
      // Verify token
      const decoded = jwt.verify(token, config.jwtSecret);
      
      // Attach user to request
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User no longer exists'
        });
      }
      
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this resource'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in authentication middleware'
    });
  }
};

/**
 * Authorize by role - Restrict access based on user role
 * @param  {...string} roles - Allowed roles
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this resource'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this resource`
      });
    }
    
    next();
  };
};



/**
 * Middleware to validate user ID in params matches authenticated user
 * Useful for protecting user-specific routes (e.g., /api/users/:id/something)
 */
exports.validateUserAccess = (req, res, next) => {
  const { userId } = req.params;
  
  // Allow admins to access any user's data
  if (req.user.role === 'admin') {
    return next();
  }
  
  // For regular users, ensure they can only access their own data
  if (userId !== req.user.id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access this resource'
    });
  }
  
  next();
};