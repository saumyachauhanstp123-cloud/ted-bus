const express = require("express");
const router = express.Router();
const { getSavedRoutes, saveRoute, deleteRoute } = require("../controllers/routeController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.get("/", getSavedRoutes);
router.post("/", saveRoute);
router.delete("/:id", deleteRoute);

module.exports = router;