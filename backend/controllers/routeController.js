const SavedRoute = require('../models/SavedRoute.js');


// GET all saved routes
exports.getSavedRoutes = async (req, res) => {
  try {
    const routes = await SavedRoute.find({ user: req.user.id })
      .sort({ createdAt: -1 });
    res.json({ success: true, routes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// SAVE a route
exports.saveRoute = async (req, res) => {
  try {
    const { name, start, destination, waypoints, distance, duration } = req.body;

    if (!start || !destination) {
      return res.status(400).json({
        success: false,
        message: "Start and destination are required"
      });
    }

    const route = await SavedRoute.create({
      user: req.user.id,
      name: name || `${start.name} → ${destination.name}`,
      start,
      destination,
      waypoints: waypoints || [],
      distance,
      duration,
    });

    res.status(201).json({ success: true, route });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE a saved route
exports.deleteRoute = async (req, res) => {
  try {
    const route = await SavedRoute.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!route) {
      return res.status(404).json({ success: false, message: "Route not found" });
    }

    res.json({ success: true, message: "Route deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};