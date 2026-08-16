const mongoose = require("mongoose");

const busSchema = new mongoose.Schema({

  busName: {
    type: String,
    required: true,
  },

  busNumber: {
    type: String,
    required: true,
    unique: true,
  },

  source: {
    type: String,
    required: true,
  },

  destination: {
    type: String,
    required: true,
  },

  departureTime: {
    type: String,
    required: true,
  },

  arrivalTime: {
    type: String,
    required: true,
  },

  price: {
    type: Number,
    required: true,
  },

  totalSeats: {
    type: Number,
    required: true,
  },
  availableSeats: {
  type: Number,
  required: true,
},
bookedSeats: [
  {
    type: String,
  },
],

});

module.exports = mongoose.model("Bus", busSchema);