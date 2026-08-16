const express = require("express");
const router = express.Router();

const {
  getRouteReviews,
  getEligibleBookings,
  createReview,
  updateReview,
  markHelpful,
  reportReview
} = require("../controllers/reviewController");

const { protect } = require("../middleware/authMiddleware");

// Public route reviews
router.get("/route/:busId", getRouteReviews);

// Auth required
router.get("/eligible/:busId", protect, getEligibleBookings);
router.post("/", protect, createReview);
router.put("/:id", protect, updateReview);
router.put("/:id/helpful", protect, markHelpful);
router.put("/:id/report", protect, reportReview);

module.exports = router;