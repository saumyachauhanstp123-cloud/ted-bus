const express = require("express");
const router = express.Router();

const {
  addBus,
  getAllBuses,
  getBusById,
  updateBus,
  deleteBus,
  searchBuses,
} = require("../controllers/busController");
// Add Bus
router.post("/add", addBus);
router.get("/", getAllBuses);
router.get("/search", searchBuses);
router.get("/:id", getBusById);
router.put("/:id", updateBus);
router.delete("/:id", deleteBus);


module.exports = router;