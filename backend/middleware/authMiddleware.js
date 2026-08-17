const jwt = require('jsonwebtoken');
const User = require('../models/user.js');

// =====================
// PROTECT — JWT verify
// =====================
exports.protect = async (req, res, next) => {
  try {
    const authorizationHeader =
      req.headers.authorization;

    let token;

    if (
      authorizationHeader &&
      authorizationHeader.startsWith('Bearer ')
    ) {
      token = authorizationHeader.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Please login first.'
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const currentUser = await User.findById(
      decoded.id
    );

    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists.'
      });
    }

    if (currentUser.isBanned) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended.'
      });
    }

    req.user = currentUser;

    next();
  } catch (error) {
    console.error(
      'Authentication middleware error:',
      error.message
    );

    return res.status(401).json({
      success: false,
      message:
        'Invalid or expired token. Please login again.'
    });
  }
};

// =====================
// VERIFIED ONLY
// =====================
exports.requireVerified = (
  req,
  res,
  next
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Please login first.'
    });
  }

  if (!req.user.isVerified) {
    return res.status(403).json({
      success: false,
      message:
        'Only verified users can post content. Please complete verification.'
    });
  }

  next();
};

// =====================
// MODERATOR / ADMIN ONLY
// =====================
exports.requireModerator = (
  req,
  res,
  next
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Please login first.'
    });
  }

  if (
    !['admin', 'moderator'].includes(
      req.user.role
    )
  ) {
    return res.status(403).json({
      success: false,
      message: 'Moderator access required.'
    });
  }

  next();
};

// =====================
// ADMIN ONLY
// =====================
exports.requireAdmin = (
  req,
  res,
  next
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Please login first.'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required.'
    });
  }

  next();
};