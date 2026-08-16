const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // =====================
  // BASIC INFO
  // =====================
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false, // Password by default queries mein nahi aayega
  },
  phone: {
    type: String,
    default: '',
  },
    // 🔥 NOTIFICATION PREFERENCES
  notificationPreferences: {
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    bookingUpdates: { type: Boolean, default: true },
    promotional: { type: Boolean, default: true },
    language: { type: String, enum: ["en", "hi"], default: "en" },
  },

  // =====================
  // ACCOUNT STATUS
  // =====================
  role: {
    type: String,
    enum: ['user', 'moderator', 'admin'],
    default: 'user',
  },
  isVerified: {
    type: Boolean,
    default: false, // Sirf verified users hi community mein post kar sakte hain
  },
  isBanned: {
    type: Boolean,
    default: false,
  },

  // =====================
  // PROFILE (Community)
  // =====================
  avatar: {
    type: String,
    default: '',
  },
  bio: {
    type: String,
    maxlength: [200, 'Bio cannot exceed 200 characters'],
    default: '',
  },
    // OTP Verification
  otp: {
    type: String,
    default: null,
  },
  otpExpires: {
    type: Date,
    default: null,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },

  // =====================
  // COMMUNITY STATS
  // =====================
  postsCount: { type: Number, default: 0 },
  totalLikesReceived: { type: Number, default: 0 },

}, { timestamps: true });

// =====================
// HASH PASSWORD BEFORE SAVE
// =====================
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// =====================
// COMPARE PASSWORD METHOD
// =====================
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

  

module.exports = mongoose.model('User', userSchema);