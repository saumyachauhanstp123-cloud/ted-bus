const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  bus: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Bus",
    required: true,
  },

  seatNumber: {
    type: String,
    required: true,
  },
  passengerName: {
  type: String,
  required: true,
},

age: {
  type: Number,
  required: true,
},

gender: {
  type: String,
  required: true,
},

mobile: {
  type: String,
  required: true,
},

  journeyDate: {
    type: String,
    required: true,
  },

  totalPrice: {
    type: Number,
    required: true,
  },

  bookingStatus: {
    type: String,
    default: "Confirmed",
  },

}, {
  timestamps: true,
});

module.exports = mongoose.model("Booking", bookingSchema);