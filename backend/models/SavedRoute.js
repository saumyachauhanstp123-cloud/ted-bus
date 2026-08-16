const mongoose = require("mongoose");

const savedRouteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: {
    type: String,
    default: "My Route",
  },
  start: {
    name: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  destination: {
    name: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  waypoints: [
    {
      name: { type: String },
      lat: { type: Number },
      lng: { type: Number },
    },
  ],
  distance: { type: String, default: "" },
  duration: { type: String, default: "" },
}, { timestamps: true });

module.exports = mongoose.model("SavedRoute", savedRouteSchema);