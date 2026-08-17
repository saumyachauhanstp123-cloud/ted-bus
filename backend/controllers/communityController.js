const Post = require("../models/Post");
const Comment = require("../models/Comment");
const Discussion = require("../models/Discussion");
const Report = require("../models/Report");
const user =require('../models/user.js');
const Notification = require("../models/Notification");

// =====================
// POSTS
// =====================

// CREATE POST (verified users only)
exports.createPost = async (req, res) => {
  try {
    if (!req.user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Only verified users can create posts. Please verify your account."
      });
    }

    const { title, content, category, imageUrl } = req.body;

    if (!title || !content || !category) {
      return res.status(400).json({
        success: false,
        message: "Title, content and category are required"
      });
    }

    const post = await Post.create({
      author: req.user.id,
      title,
      content,
      category,
      imageUrl: imageUrl || "",
    });

    const populated = await Post.findById(post._id)
      .populate("author", "name avatar isVerified");

    // Update user's post count
    await User.findByIdAndUpdate(req.user.id, { $inc: { postsCount: 1 } });

    res.status(201).json({
      success: true,
      message: "Post created successfully!",
      post: populated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET ALL POSTS (public)
exports.getPosts = async (req, res) => {
  try {
    const { category, search, sort = "recent", page = 1, limit = 10 } = req.query;

    const filter = { status: "active" };

    if (category) filter.category = category;
    if (search) filter.$text = { $search: search };

    const sortOption = sort === "popular"
      ? { likes: -1, commentCount: -1 }
      : { createdAt: -1 };

    const skip = (Number(page) - 1) * Number(limit);

    const posts = await Post.find(filter)
      .populate("author", "name avatar isVerified")
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit));

    const total = await Post.countDocuments(filter);

    res.status(200).json({
      success: true,
      posts,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET SINGLE POST
exports.getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("author", "name avatar isVerified bio");

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    res.status(200).json({ success: true, post });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE POST (owner only)
exports.updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const { title, content, category, imageUrl } = req.body;
    if (title) post.title = title;
    if (content) post.content = content;
    if (category) post.category = category;
    if (imageUrl !== undefined) post.imageUrl = imageUrl;

    await post.save();

    const updated = await Post.findById(post._id)
      .populate("author", "name avatar isVerified");

    res.status(200).json({ success: true, message: "Post updated", post: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE POST (owner or moderator)
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    const isOwner = post.author.toString() === req.user.id;
    const isMod = ["admin", "moderator"].includes(req.user.role);

    if (!isOwner && !isMod) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    await post.deleteOne();
    await Comment.deleteMany({ post: post._id });
    await User.findByIdAndUpdate(post.author, { $inc: { postsCount: -1 } });

    res.status(200).json({ success: true, message: "Post deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// LIKE / UNLIKE POST
exports.toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    const userId = req.user.id;
    const alreadyLiked = post.likes.some(id => id.toString() === userId);

    if (alreadyLiked) {
      post.likes = post.likes.filter(id => id.toString() !== userId);
    } else {
      post.likes.push(userId);

      // Notify post author (if not liking own post)
      if (post.author.toString() !== userId) {
        await Notification.create({
          user: post.author,
          title: "Post Liked ❤️",
          message: `${req.user.name} liked your post "${post.title}"`,
          type: "System",
        });
      }
    }

    await post.save();

    res.status(200).json({
      success: true,
      likesCount: post.likes.length,
      liked: !alreadyLiked,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// SHARE POST
exports.sharePost = async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $inc: { shareCount: 1 } },
      { new: true }
    );

    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    const shareUrl = `${process.env.CLIENT_URL}/community/post/${post._id}`;

    res.status(200).json({
      success: true,
      shareUrl,
      shareCount: post.shareCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =====================
// COMMENTS
// =====================

// ADD COMMENT
exports.addComment = async (req, res) => {
  try {
    if (!req.user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Only verified users can comment"
      });
    }

    const { message } = req.body;
    const post = await Post.findById(req.params.postId);

    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    const comment = await Comment.create({
      post: post._id,
      author: req.user.id,
      message,
    });

    post.commentCount += 1;
    await post.save();

    const populated = await Comment.findById(comment._id)
      .populate("author", "name avatar isVerified");

    // Notify post author
    if (post.author.toString() !== req.user.id) {
      await Notification.create({
        user: post.author,
        title: "New Comment 💬",
        message: `${req.user.name} commented on your post "${post.title}"`,
        type: "System",
      });
    }

    res.status(201).json({ success: true, comment: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET COMMENTS FOR A POST
exports.getComments = async (req, res) => {
  try {
    const comments = await Comment.find({
      post: req.params.postId,
      status: "active",
    })
      .populate("author", "name avatar isVerified")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, comments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE COMMENT
exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ success: false, message: "Comment not found" });

    const isOwner = comment.author.toString() === req.user.id;
    const isMod = ["admin", "moderator"].includes(req.user.role);

    if (!isOwner && !isMod) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    await comment.deleteOne();
    await Post.findByIdAndUpdate(comment.post, { $inc: { commentCount: -1 } });

    res.status(200).json({ success: true, message: "Comment deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =====================
// DISCUSSIONS
// =====================

// CREATE DISCUSSION
exports.createDiscussion = async (req, res) => {
  try {
    if (!req.user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Only verified users can create discussions"
      });
    }

    const { topic, title, message } = req.body;

    const discussion = await Discussion.create({
      author: req.user.id,
      topic,
      title,
      message,
    });

    const populated = await Discussion.findById(discussion._id)
      .populate("author", "name avatar isVerified");

    res.status(201).json({ success: true, discussion: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET ALL DISCUSSIONS
exports.getDiscussions = async (req, res) => {
  try {
    const { topic } = req.query;
    const filter = {};
    if (topic) filter.topic = topic;

    const discussions = await Discussion.find(filter)
      .populate("author", "name avatar isVerified")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, discussions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ADD REPLY TO DISCUSSION
exports.addReply = async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.id);
    if (!discussion) return res.status(404).json({ success: false, message: "Not found" });

    discussion.replies.push({
      author: req.user.id,
      message: req.body.message,
    });

    await discussion.save();

    const updated = await Discussion.findById(discussion._id)
      .populate("author", "name avatar isVerified")
      .populate("replies.author", "name avatar");

    res.status(201).json({ success: true, discussion: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =====================
// REPORTS (Moderation)
// =====================

exports.reportContent = async (req, res) => {
  try {
    const { contentType, contentId, reason, description } = req.body;

    const report = await Report.create({
      reporter: req.user.id,
      contentType,
      contentId,
      reason,
      description,
    });

    // Mark content as reported
    if (contentType === "post") {
      await Post.findByIdAndUpdate(contentId, {
        isReported: true,
        $inc: { reportCount: 1 },
      });
    }

    res.status(201).json({ success: true, message: "Content reported", report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET USER PROFILE STATS
// =====================
// GET CURRENT USER COMMUNITY STATS
// GET /api/community/stats
// =====================
exports.getUserStats = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    // User ke active posts.
    // $exists false purane posts ko bhi include karega.
    const posts = await Post.find({
      author: userId,
      $or: [
        { status: "active" },
        { status: { $exists: false } }
      ]
    }).select("_id likes");

    const postIds = posts.map((post) => post._id);

    // User ke posts ko mile total likes
    const totalLikes = posts.reduce((total, post) => {
      return total + (Array.isArray(post.likes) ? post.likes.length : 0);
    }, 0);

    // User ke posts par aaye total comments
    const totalComments = postIds.length
      ? await Comment.countDocuments({
          post: { $in: postIds },
          $or: [
            { status: "active" },
            { status: { $exists: false } }
          ]
        })
      : 0;

    // User ne khud jitne comments likhe
    const commentsWritten = await Comment.countDocuments({
      author: userId,
      $or: [
        { status: "active" },
        { status: { $exists: false } }
      ]
    });

    res.status(200).json({
      success: true,
      stats: {
        totalPosts: posts.length,
        totalLikes,
        totalComments,
        commentsWritten
      }
    });
  } catch (error) {
    console.error("Community Stats Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load community statistics"
    });
  }
};