const router = require('express').Router();
const {
  register,
  login,
  getMe,
  updateProfile,
  verifyMe,
  verifyOTP,
  resendOTP,
  updateLanguage
} = require('../controllers/authController');

const { protect } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);

// Protected routes
router.get('/me', protect, getMe);
router.put('/update-profile', protect, updateProfile);
router.put('/verify-me', protect, verifyMe);
router.put('/language', protect, updateLanguage);

module.exports = router;