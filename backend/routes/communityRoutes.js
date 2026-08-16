const express = require("express");
const router = express.Router();

const {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
  toggleLike,
  sharePost,
  addComment,
  getComments,
  deleteComment,
  createDiscussion,
  getDiscussions,
  addReply,
  reportContent,
  getUserStats,
} = require("../controllers/communityController");

const { protect, requireVerified } = require("../middleware/authMiddleware");

// ===================== POSTS =====================
router.get("/posts", getPosts);                          // Public
router.get("/posts/:id", getPostById);                   // Public
router.post("/posts", protect, createPost);              // Verified
router.put("/posts/:id", protect, updatePost);           // Owner
router.delete("/posts/:id", protect, deletePost);        // Owner/Mod
router.post("/posts/:id/like", protect, toggleLike);     // Auth
router.post("/posts/:id/share", protect, sharePost);     // Auth

// ===================== COMMENTS =====================
router.get("/posts/:postId/comments", getComments);                  // Public
router.post("/posts/:postId/comments", protect, addComment);         // Verified
router.delete("/comments/:id", protect, deleteComment);              // Owner/Mod

// ===================== DISCUSSIONS =====================
router.get("/discussions", getDiscussions);                          // Public
router.post("/discussions", protect, createDiscussion);              // Verified
router.post("/discussions/:id/reply", protect, addReply);            // Auth

// ===================== REPORTS =====================
router.post("/report", protect, reportContent);                      // Auth

// ===================== USER STATS =====================
router.get("/stats", protect, getUserStats);                         // Auth

module.exports = router;