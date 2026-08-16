const express = require("express");
const router = express.Router();

const {
  bookTicket,
  getMyBookings,
  cancelBooking,
} = require("../controllers/bookingController");

// 🔥 FIX: protect ko destructure karke import karo
const { protect } = require("../middleware/authMiddleware");

// Book Ticket
router.post("/book", protect, bookTicket);
router.get("/my-bookings", protect, getMyBookings);
router.put("/cancel/:id", protect, cancelBooking);

module.exports = router;