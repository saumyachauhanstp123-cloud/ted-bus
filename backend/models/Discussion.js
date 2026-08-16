const mongoose = require("mongoose");

const discussionSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  topic: {
    type: String,
    enum: ["Routes", "Destinations", "Travel Advice"],
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  message: {
    type: String,
    required: true,
  },
  replies: [{
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    message: String,
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
}, { timestamps: true });

module.exports = mongoose.model("Discussion", discussionSchema);