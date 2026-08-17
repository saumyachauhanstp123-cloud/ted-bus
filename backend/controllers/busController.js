const Bus = require('../models/bus.js');

// =====================
// ADD NEW BUS (Admin)
// POST /api/bus/add
// =====================
const addBus = async (req, res) => {
  try {
    const {
      busName,
      busNumber,
      source,
      destination,
      departureTime,
      arrivalTime,
      price,
      totalSeats,
      busType // Added: e.g., 'AC Sleeper', 'Non-AC Seater'
    } = req.body;

    const existingBus = await Bus.findOne({ busNumber });
    if (existingBus) {
      return res.status(400).json({
        success: false,
        message: "Bus with this number already exists"
      });
    }

    const newBus = await Bus.create({
      busName,
      busNumber,
      source,
      destination,
      departureTime,
      arrivalTime,
      price,
      totalSeats,
      availableSeats: totalSeats,
      busType: busType || 'Standard'
    });

    res.status(201).json({
      success: true,
      message: "Bus Added Successfully",
      bus: newBus
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =====================
// GET ALL BUSES
// GET /api/bus
// =====================
const getAllBuses = async (req, res) => {
  try {
    const buses = await Bus.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: buses.length,
      buses
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =====================
// GET BUS BY ID
// GET /api/bus/:id
// =====================
const getBusById = async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id);
    if (!bus) {
      return res.status(404).json({
        success: false,
        message: "Bus not found"
      });
    }

    res.status(200).json({
      success: true,
      bus
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Invalid Bus ID or Server Error" });
  }
};

// =====================
// SEARCH BUSES
// GET /api/bus/search?source=X&destination=Y
// =====================
const searchBuses = async (req, res) => {
  try {
    const { source, destination } = req.query;

    if (!source || !destination) {
      return res.status(400).json({
        success: false,
        message: "Please provide both source and destination"
      });
    }

    // Case-insensitive search using Regex
    const buses = await Bus.find({
      source: { $regex: new RegExp(`^${source.trim()}$`, 'i') },
      destination: { $regex: new RegExp(`^${destination.trim()}$`, 'i') }
    });

    res.status(200).json({
      success: true,
      count: buses.length,
      buses
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =====================
// UPDATE BUS
// PUT /api/bus/:id
// =====================
const updateBus = async (req, res) => {
  try {
    const updatedBus = await Bus.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedBus) {
      return res.status(404).json({ success: false, message: "Bus not found" });
    }

    res.status(200).json({
      success: true,
      message: "Bus Updated Successfully",
      bus: updatedBus
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =====================
// DELETE BUS
// DELETE /api/bus/:id
// =====================
const deleteBus = async (req, res) => {
  try {
    const deletedBus = await Bus.findByIdAndDelete(req.params.id);
    if (!deletedBus) {
      return res.status(404).json({ success: false, message: "Bus not found" });
    }

    res.status(200).json({
      success: true,
      message: "Bus Deleted Successfully"
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  addBus,
  getAllBuses,
  getBusById,
  updateBus,
  deleteBus,
  searchBuses,
};
