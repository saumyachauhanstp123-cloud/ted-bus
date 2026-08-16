const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking",
    required: true
  },

  bus: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Bus",
    required: true
  },

  routeKey: {
    type: String,
    required: true
  },

  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },

  reviewText: {
    type: String,
    required: true,
    minlength: 20,
    maxlength: 1000
  },

  helpfulBy: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  ],

  reports: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      reason: {
        type: String,
        default: "other"
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }
  ],

  reportCount: {
    type: Number,
    default: 0
  },

  status: {
    type: String,
    enum: ["active", "hidden", "removed"],
    default: "active"
  }
}, {
  timestamps: true
});

// One user can review one booking only once
reviewSchema.index({ user: 1, booking: 1 }, { unique: true });

module.exports = mongoose.model("Review", reviewSchema);