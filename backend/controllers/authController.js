const user = require('../models/User');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');

// =====================
// GENERATE JWT TOKEN
// =====================
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// =====================
// GENERATE OTP
// =====================
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// =====================
// REGISTER + SEND OTP
// POST /api/auth/register
// =====================
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email and password'
      });
    }

   const existingUser = await User.findOne({ email });
if (existingUser) {
  // ✅ Agar user hai but verified nahi → OTP resend karo
  if (!existingUser.isVerified) {
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    existingUser.otp = otp;
    existingUser.otpExpires = otpExpires;
    await existingUser.save();

    try {
      await sendEmail({
        to: email,
        subject: 'Your TED BUS Verification OTP',
        text: `Hello ${existingUser.name},\n\nYour OTP is: ${otp}\n\nValid for 10 minutes.\n\nTeam TED BUS`
      });
    } catch (emailError) {
      console.error('OTP email failed:', emailError.message);
    }

    return res.status(200).json({
      success: true,
      message: 'OTP resent to your email. Please verify.',
      email: existingUser.email
    });
  }

  // ❌ Agar user hai aur verified bhi hai → Error
  return res.status(400).json({
    success: false,
    message: 'Email already registered. Please login instead.'
  });
}

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const user = await User.create({
      name,
      email,
      password,
      phone,
      otp,
      otpExpires,
      isVerified: false
    });

    // Send OTP via Email
    try {
      await sendEmail({
        to: email,
        subject: 'Your TED BUS Verification OTP',
        text: `Hello ${name},\n\nYour OTP for TED BUS registration is: ${otp}\n\nThis OTP is valid for 10 minutes.\n\nHappy Journey!\nTeam TED BUS`
      });
    } catch (emailError) {
      console.error('OTP email failed:', emailError.message);
    }

    res.status(200).json({
      success: true,
      message: 'Registration successful! OTP sent to your email.',
      email: user.email
    });

  } catch (error) {
    console.error('Register Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.'
    });
  }
};

// =====================
// VERIFY OTP
// POST /api/auth/verify-otp
// =====================
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Account is already verified. Please login.'
      });
    }

    if (!user.otp || user.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please try again.'
      });
    }

    if (new Date() > user.otpExpires) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.'
      });
    }

    // Verify user
    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Account verified successfully!',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
        avatar: user.avatar,
        bio: user.bio,
        createdAt: user.createdAt,
      }
    });

  } catch (error) {
    console.error('Verify OTP Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'OTP verification failed'
    });
  }
};

// =====================
// RESEND OTP
// POST /api/auth/resend-otp
// =====================
exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Account is already verified'
      });
    }

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    await sendEmail({
      to: email,
      subject: 'Your TED BUS Verification OTP (Resent)',
      text: `Hello ${user.name},\n\nYour new OTP is: ${otp}\n\nValid for 10 minutes.\n\nTeam TED BUS`
    });

    res.status(200).json({
      success: true,
      message: 'New OTP sent to your email'
    });

  } catch (error) {
    console.error('Resend OTP Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to resend OTP'
    });
  }
};

// =====================
// LOGIN
// POST /api/auth/login
// =====================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Contact support.'
      });
    }

    // Check if OTP verified
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email with OTP first.',
        needsVerification: true,
        email: user.email
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
        avatar: user.avatar,
        bio: user.bio,
        createdAt: user.createdAt,
      }
    });

  } catch (error) {
    console.error('Login Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.'
    });
  }
};

// =====================
// GET CURRENT USER
// GET /api/auth/me
// =====================
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
        avatar: user.avatar,
        bio: user.bio,
        postsCount: user.postsCount,
        createdAt: user.createdAt,
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user data'
    });
  }
};

// =====================
// UPDATE PROFILE
// PUT /api/auth/update-profile
// =====================
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, bio, avatar } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, phone, bio, avatar },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully!',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
        avatar: user.avatar,
        bio: user.bio,
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Profile update failed'
    });
  }
};

// =====================
// VERIFY ME (testing)
// PUT /api/auth/verify-me
// =====================
exports.verifyMe = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { isVerified: true },
      { new: true }
    );

    res.json({
      success: true,
      message: 'You are now verified!',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
        role: user.role,
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =====================
// UPDATE LANGUAGE
// PUT /api/auth/language
// =====================
exports.updateLanguage = async (req, res) => {
  try {
    const { language } = req.body;

    if (!['en', 'hi'].includes(language)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid language. Only en and hi are allowed.'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { 'notificationPreferences.language': language },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Language preference updated',
      language: user.notificationPreferences?.language || language
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};