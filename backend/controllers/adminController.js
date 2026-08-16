const User = require("../models/User");
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const Booking = require("../models/Booking");
const Report = require("../models/Report");
const Notification = require("../models/Notification");

// =====================
// DASHBOARD STATS
// =====================
exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const verifiedUsers = await User.countDocuments({ isVerified: true });
    const bannedUsers = await User.countDocuments({ isBanned: true });
    const totalPosts = await Post.countDocuments();
    const activePosts = await Post.countDocuments({ status: "active" });
    const totalBookings = await Booking.countDocuments();
    const totalComments = await Comment.countDocuments();
    const pendingReports = await Report.countDocuments({ status: "pending" });

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        verifiedUsers,
        bannedUsers,
        totalPosts,
        activePosts,
        totalBookings,
        totalComments,
        pendingReports,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =====================
// GET ALL REPORTS
// =====================
exports.getAllReports = async (req, res) => {
  try {
    const { status = "pending" } = req.query;

    const filter = {};
    if (status !== "all") filter.status = status;

    const reports = await Report.find(filter)
      .populate("reporter", "name email")
      .populate("reviewedBy", "name")
      .sort({ createdAt: -1 });

    // Attach content details
    const enrichedReports = await Promise.all(
      reports.map(async (r) => {
        let content = null;
        if (r.contentType === "post") {
          content = await Post.findById(r.contentId).populate("author", "name email");
        } else if (r.contentType === "comment") {
          content = await Comment.findById(r.contentId).populate("author", "name email");
        }
        return { ...r.toObject(), content };
      })
    );

    res.status(200).json({ success: true, reports: enrichedReports });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =====================
// REVIEW REPORT (Remove / Dismiss / Ban)
// =====================
exports.reviewReport = async (req, res) => {
  try {
    const { action, note } = req.body; // action: 'remove' | 'dismiss' | 'ban'
    const report = await Report.findById(req.params.id);

    if (!report) return res.status(404).json({ success: false, message: "Report not found" });

    const Model = report.contentType === "post" ? Post : Comment;
    const content = await Model.findById(report.contentId);

    if (action === "remove") {
      if (content) {
        content.status = "removed";
        await content.save();
      }
      report.status = "actioned";

      // Notify content author
      if (content?.author) {
        await Notification.create({
          user: content.author,
          title: "Content Removed 🚫",
          message: `Your ${report.contentType} has been removed for violating community guidelines.`,
          type: "Alert",
        });
      }
    } else if (action === "dismiss") {
      if (content) {
        content.status = "active";
        await content.save();
      }
      report.status = "dismissed";
    } else if (action === "ban") {
      if (content?.author) {
        await User.findByIdAndUpdate(content.author, { isBanned: true });

        // Also remove the content
        content.status = "removed";
        await content.save();

        await Notification.create({
          user: content.author,
          title: "Account Suspended ⛔",
          message: `Your account has been suspended due to community guideline violations.`,
          type: "Alert",
        });
      }
      report.status = "actioned";
    }

    report.reviewedBy = req.user.id;
    report.status === "actioned";
    if (note) report.description = `${report.description}\n\nModerator note: ${note}`;

    await report.save();

    res.status(200).json({ success: true, message: "Action taken", report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =====================
// GET ALL USERS
// =====================
exports.getAllUsers = async (req, res) => {
  try {
    const { search, filter } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (filter === "verified") query.isVerified = true;
    if (filter === "unverified") query.isVerified = false;
    if (filter === "banned") query.isBanned = true;
    if (filter === "admin") query.role = { $in: ["admin", "moderator"] };

    const users = await User.find(query).sort({ createdAt: -1 }).limit(100);
    res.status(200).json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =====================
// TOGGLE USER VERIFICATION
// =====================
exports.toggleVerification = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.isVerified = !user.isVerified;
    await user.save();

    // Notify user
    if (user.isVerified) {
      await Notification.create({
        user: user._id,
        title: "You're Verified! ✓",
        message: "Congratulations! Your account has been verified. You can now post in the community.",
        type: "System",
      });
    }

    res.status(200).json({
      success: true,
      message: user.isVerified ? "User verified" : "Verification removed",
      user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =====================
// TOGGLE USER BAN
// =====================
exports.toggleBan = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (user.role === "admin") {
      return res.status(403).json({ success: false, message: "Cannot ban admin users" });
    }

    user.isBanned = !user.isBanned;
    await user.save();

    res.status(200).json({
      success: true,
      message: user.isBanned ? "User banned" : "User unbanned",
      user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =====================
// CHANGE USER ROLE
// =====================
exports.changeUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!["user", "moderator", "admin"].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    );

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.status(200).json({ success: true, message: `Role changed to ${role}`, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =====================
// DELETE POST (Admin override)
// =====================
exports.deletePostAsAdmin = async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    await Comment.deleteMany({ post: post._id });
    await User.findByIdAndUpdate(post.author, { $inc: { postsCount: -1 } });

    res.status(200).json({ success: true, message: "Post deleted by admin" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};