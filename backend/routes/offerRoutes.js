const express = require("express");
const router = express.Router();
const { getActiveOffers, getAllOffers, createOffer, deleteOffer, applyPromoCode } = require("../controllers/offerController");
const { protect, requireAdmin, requireModerator } = require("../middleware/authMiddleware");

// Public Routes
router.get("/active", getActiveOffers);
router.post("/apply", protect, applyPromoCode); // Logged in user can apply

// Admin Routes
router.get("/", protect, requireModerator, getAllOffers);
router.post("/", protect, requireAdmin, createOffer);
router.delete("/:id", protect, requireAdmin, deleteOffer);

module.exports = router;