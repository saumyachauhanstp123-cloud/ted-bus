const express = require("express");
const router = express.Router();

const {
  getDashboardStats,
  getAllReports,
  reviewReport,
  getAllUsers,
  toggleVerification,
  toggleBan,
  changeUserRole,
  deletePostAsAdmin,
} = require("../controllers/adminController");

const { protect, requireModerator, requireAdmin } = require("../middleware/authMiddleware");

// All admin routes require moderator or admin
router.use(protect);

router.get("/stats", requireModerator, getDashboardStats);
router.get("/reports", requireModerator, getAllReports);
router.put("/reports/:id/review", requireModerator, reviewReport);

router.get("/users", requireModerator, getAllUsers);
router.put("/users/:id/verify", requireAdmin, toggleVerification);
router.put("/users/:id/ban", requireAdmin, toggleBan);
router.put("/users/:id/role", requireAdmin, changeUserRole);

router.delete("/posts/:id", requireModerator, deletePostAsAdmin);

module.exports = router;