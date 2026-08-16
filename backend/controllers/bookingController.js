const Booking = require("../models/Booking");
const Bus = require("../models/Bus");
const Notification = require("../models/Notification"); 
const { sendNotification } = require("../utils/notificationHelper");
// =====================
// BOOK TICKET
// POST /api/booking/book
// =====================
const bookTicket = async (req, res) => {
  try {
    const {
      bus,
      seatNumber,
      passengerName,
      age,
      gender,
      mobile,
      journeyDate,
      totalPrice,
    } = req.body;

    // Validation
    if (!bus || !seatNumber || !passengerName || !age || !gender || !mobile || !journeyDate) {
      return res.status(400).json({
        success: false,
        message: "Please provide all booking details"
      });
    }

    const selectedBus = await Bus.findById(bus);
    if (!selectedBus) {
      return res.status(404).json({ success: false, message: "Bus not found" });
    }

    if (selectedBus.availableSeats <= 0) {
      return res.status(400).json({ success: false, message: "No seats available" });
    }

    if (selectedBus.bookedSeats.includes(seatNumber)) {
      return res.status(400).json({ success: false, message: "Seat already booked" });
    }

    // Update bus
    selectedBus.availableSeats -= 1;
    selectedBus.bookedSeats.push(seatNumber);
    await selectedBus.save();

    // Create booking
    const newBooking = await Booking.create({
      user: req.user.id,
      bus,
      seatNumber,
      passengerName,
      age,
      gender,
      mobile,
      journeyDate,
      totalPrice,
    });

    // Populate bus details before sending
    const populatedBooking = await Booking.findById(newBooking._id).populate("bus");
        // 🔥 Auto-create Notification
       // 🔥 Advanced multi-channel notification
    await sendNotification({
      userId: req.user.id,
      templateKey: "BOOKING_CONFIRMED",
      type: "Booking",
      data: {
        busName: selectedBus.busName,
        source: selectedBus.source,
        destination: selectedBus.destination,
        seat: seatNumber,
        date: journeyDate,
      },
    });

    res.status(201).json({
      success: true,
      message: "Ticket Booked Successfully",
      booking: populatedBooking,
    });

  } catch (error) {
    console.error("Book Ticket Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// =====================
// GET MY BOOKINGS (all - confirmed + cancelled)
// GET /api/booking/my-bookings
// =====================
const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate("bus")
      .sort({ createdAt: -1 }); // Latest first

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =====================
// CANCEL BOOKING
// PUT /api/booking/cancel/:id
// =====================
const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to cancel this booking"
      });
    }

    if (booking.bookingStatus === "Cancelled") {
      return res.status(400).json({
        success: false,
        message: "Booking is already cancelled"
      });
    }

    // Mark booking as cancelled
    booking.bookingStatus = "Cancelled";
    await booking.save();

    // 🔥 FIX: Release seat back to bus (remove from bookedSeats + increase availableSeats)
    const selectedBus = await Bus.findById(booking.bus);
    if (selectedBus) {
      selectedBus.availableSeats += 1;
      selectedBus.bookedSeats = selectedBus.bookedSeats.filter(
        (seat) => seat !== booking.seatNumber
      );
      await selectedBus.save();
    }
        // 🔥 Auto-create Notification
      await sendNotification({
      userId: req.user.id,
      templateKey: "BOOKING_CANCELLED",
      type: "Cancellation",
      data: { seat: booking.seatNumber },
    });



    res.status(200).json({
      success: true,
      message: "Booking Cancelled Successfully",
      booking,
    });

  } catch (error) {
    console.error("Cancel Booking Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  bookTicket,
  getMyBookings,
  cancelBooking,
};

