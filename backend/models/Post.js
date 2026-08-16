const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: {
    type: String,
    required: [true, "Title is required"],
    trim: true,
    maxlength: 200,
  },
  content: {
    type: String,
    required: [true, "Content is required"],
    minlength: 20,
  },
  imageUrl: {
    type: String,
    default: "",
  },
  category: {
    type: String,
    enum: ["Travel Tips", "Routes", "Destinations", "Journey Stories"],
    required: true,
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }],
  commentCount: {
    type: Number,
    default: 0,
  },
  shareCount: {
    type: Number,
    default: 0,
  },
  isReported: {
    type: Boolean,
    default: false,
  },
  reportCount: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ["active", "reported", "removed"],
    default: "active",
  },
}, { timestamps: true });

postSchema.index({ title: "text", content: "text" });

module.exports = mongoose.model("Post", postSchema);