const Post = require('../models/Post.js');
const Comment = require('../models/Comment.js');
const Discussion = require('../models/Discussion.js');
const Report = require('../models/Report.js');
const User = require('../models/user.js');
const Notification = require('../models/Notification.js');

// ==================================================
// COMMUNITY STATS HELPER
// Current user ki posts par received likes/comments
// calculate karega.
// ==================================================
const calculateCommunityStats = async (userId) => {
  const posts = await Post.find({
    author: userId,
    $or: [
      { status: 'active' },
      { status: { $exists: false } }
    ]
  })
    .select('_id likes commentCount')
    .lean();

  const totalLikes = posts.reduce(
    (total, post) => {
      const likesCount = Array.isArray(post.likes)
        ? post.likes.length
        : 0;

      return total + likesCount;
    },
    0
  );

  const totalComments = posts.reduce(
    (total, post) => {
      return total + Number(post.commentCount || 0);
    },
    0
  );

  return {
    totalPosts: posts.length,
    totalLikes,
    totalComments
  };
};

// =====================
// POSTS
// =====================

// CREATE POST
exports.createPost = async (req, res) => {
  try {
    if (!req.user.isVerified) {
      return res.status(403).json({
        success: false,
        message:
          'Only verified users can create posts. Please verify your account.'
      });
    }

    const {
      title,
      content,
      category,
      imageUrl
    } = req.body;

    if (!title || !content || !category) {
      return res.status(400).json({
        success: false,
        message:
          'Title, content and category are required'
      });
    }

    const post = await Post.create({
      author: req.user._id,
      title,
      content,
      category,
      imageUrl: imageUrl || ''
    });

    const populated = await Post.findById(
      post._id
    ).populate(
      'author',
      'name avatar isVerified'
    );

    await User.findByIdAndUpdate(
      req.user._id,
      {
        $inc: {
          postsCount: 1
        }
      }
    );

    return res.status(201).json({
      success: true,
      message: 'Post created successfully!',
      post: populated
    });
  } catch (error) {
    console.error(
      'Create Post Error:',
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// GET ALL POSTS
exports.getPosts = async (req, res) => {
  try {
    const {
      category,
      search,
      sort = 'recent',
      page = 1,
      limit = 10
    } = req.query;

    const filter = {
      status: 'active'
    };

    if (category) {
      filter.category = category;
    }

    if (search) {
      filter.$text = {
        $search: search
      };
    }

    const sortOption =
      sort === 'popular'
        ? {
            likes: -1,
            commentCount: -1
          }
        : {
            createdAt: -1
          };

    const skip =
      (Number(page) - 1) * Number(limit);

    const posts = await Post.find(filter)
      .populate(
        'author',
        'name avatar isVerified'
      )
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit));

    const total =
      await Post.countDocuments(filter);

    return res.status(200).json({
      success: true,
      posts,
      total,
      page: Number(page),
      pages: Math.ceil(
        total / Number(limit)
      )
    });
  } catch (error) {
    console.error(
      'Get Posts Error:',
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// GET SINGLE POST
exports.getPostById = async (req, res) => {
  try {
    const post = await Post.findById(
      req.params.id
    ).populate(
      'author',
      'name avatar isVerified bio'
    );

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    return res.status(200).json({
      success: true,
      post
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// UPDATE POST
exports.updatePost = async (req, res) => {
  try {
    const post = await Post.findById(
      req.params.id
    );

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    if (
      post.author.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const {
      title,
      content,
      category,
      imageUrl
    } = req.body;

    if (title) {
      post.title = title;
    }

    if (content) {
      post.content = content;
    }

    if (category) {
      post.category = category;
    }

    if (imageUrl !== undefined) {
      post.imageUrl = imageUrl;
    }

    await post.save();

    const updated = await Post.findById(
      post._id
    ).populate(
      'author',
      'name avatar isVerified'
    );

    return res.status(200).json({
      success: true,
      message: 'Post updated',
      post: updated
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// DELETE POST
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(
      req.params.id
    );

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const isOwner =
      post.author.toString() ===
      req.user._id.toString();

    const isModerator = [
      'admin',
      'moderator'
    ].includes(req.user.role);

    if (!isOwner && !isModerator) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    await post.deleteOne();

    await Comment.deleteMany({
      post: post._id
    });

    await User.findByIdAndUpdate(
      post.author,
      {
        $inc: {
          postsCount: -1
        }
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Post deleted'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =====================
// LIKE / UNLIKE POST
// =====================
exports.toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(
      req.params.id
    );

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const userId =
      req.user._id.toString();

    const alreadyLiked =
      post.likes.some(
        id =>
          id.toString() === userId
      );

    /*
     * Atomic MongoDB update:
     * Like present hai to remove,
     * otherwise add.
     */
    const updatedPost =
      await Post.findByIdAndUpdate(
        post._id,
        alreadyLiked
          ? {
              $pull: {
                likes: req.user._id
              }
            }
          : {
              $addToSet: {
                likes: req.user._id
              }
            },
        {
          new: true,
          runValidators: true
        }
      );

    /*
     * Notification fail hone par
     * like request fail nahi hogi.
     */
    if (
      !alreadyLiked &&
      post.author.toString() !== userId
    ) {
      try {
        await Notification.create({
          user: post.author,
          title: 'Post Liked ❤️',
          message:
            `${req.user.name} liked your post "${post.title}"`,
          type: 'System'
        });
      } catch (notificationError) {
        console.error(
          'Like notification failed:',
          notificationError.message
        );
      }
    }

    const likes =
      updatedPost.likes.map(
        id => id.toString()
      );

    /*
     * Current logged-in user ke dashboard
     * stats recalculate honge.
     */
    const stats =
      await calculateCommunityStats(
        req.user._id
      );

    return res.status(200).json({
      success: true,
      message: alreadyLiked
        ? 'Post unliked'
        : 'Post liked',
      liked: !alreadyLiked,
      likes,
      likesCount: likes.length,
      stats
    });
  } catch (error) {
    console.error(
      'Toggle Like Error:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        'Failed to update like'
    });
  }
};

// SHARE POST
exports.sharePost = async (req, res) => {
  try {
    const post =
      await Post.findByIdAndUpdate(
        req.params.id,
        {
          $inc: {
            shareCount: 1
          }
        },
        {
          new: true
        }
      );

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const shareUrl =
      `${process.env.CLIENT_URL}/community/post/${post._id}`;

    return res.status(200).json({
      success: true,
      shareUrl,
      shareCount: post.shareCount
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
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
        message:
          'Only verified users can comment'
      });
    }

    const message =
      String(
        req.body.message || ''
      ).trim();

    if (!message) {
      return res.status(400).json({
        success: false,
        message:
          'Comment message is required'
      });
    }

    const post = await Post.findById(
      req.params.postId
    );

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const comment =
      await Comment.create({
        post: post._id,
        author: req.user._id,
        message
      });

    /*
     * MongoDB me comment count
     * directly increment hoga.
     */
    const updatedPost =
      await Post.findByIdAndUpdate(
        post._id,
        {
          $inc: {
            commentCount: 1
          }
        },
        {
          new: true
        }
      );

    const populated =
      await Comment.findById(
        comment._id
      ).populate(
        'author',
        'name avatar isVerified'
      );

    /*
     * Notification fail hone par
     * comment API fail nahi hogi.
     */
    if (
      post.author.toString() !==
      req.user._id.toString()
    ) {
      try {
        await Notification.create({
          user: post.author,
          title: 'New Comment 💬',
          message:
            `${req.user.name} commented on your post "${post.title}"`,
          type: 'System'
        });
      } catch (notificationError) {
        console.error(
          'Comment notification failed:',
          notificationError.message
        );
      }
    }

    const stats =
      await calculateCommunityStats(
        req.user._id
      );

    return res.status(201).json({
      success: true,
      comment: populated,
      commentCount:
        updatedPost.commentCount,
      stats
    });
  } catch (error) {
    console.error(
      'Add Comment Error:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        'Failed to add comment'
    });
  }
};

// GET COMMENTS
exports.getComments = async (req, res) => {
  try {
    const comments = await Comment.find({
      post: req.params.postId,
      status: 'active'
    })
      .populate(
        'author',
        'name avatar isVerified'
      )
      .sort({
        createdAt: -1
      });

    return res.status(200).json({
      success: true,
      comments
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// DELETE COMMENT
exports.deleteComment = async (req, res) => {
  try {
    const comment =
      await Comment.findById(
        req.params.id
      );

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    const isOwner =
      comment.author.toString() ===
      req.user._id.toString();

    const isModerator = [
      'admin',
      'moderator'
    ].includes(req.user.role);

    if (!isOwner && !isModerator) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    await comment.deleteOne();

    await Post.findByIdAndUpdate(
      comment.post,
      {
        $inc: {
          commentCount: -1
        }
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Comment deleted'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
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
        message:
          'Only verified users can create discussions'
      });
    }

    const {
      topic,
      title,
      message
    } = req.body;

    const discussion =
      await Discussion.create({
        author: req.user._id,
        topic,
        title,
        message
      });

    const populated =
      await Discussion.findById(
        discussion._id
      ).populate(
        'author',
        'name avatar isVerified'
      );

    return res.status(201).json({
      success: true,
      discussion: populated
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// GET DISCUSSIONS
exports.getDiscussions = async (req, res) => {
  try {
    const { topic } = req.query;

    const filter = {};

    if (topic) {
      filter.topic = topic;
    }

    const discussions =
      await Discussion.find(filter)
        .populate(
          'author',
          'name avatar isVerified'
        )
        .sort({
          createdAt: -1
        });

    return res.status(200).json({
      success: true,
      discussions
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ADD REPLY
exports.addReply = async (req, res) => {
  try {
    const discussion =
      await Discussion.findById(
        req.params.id
      );

    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: 'Not found'
      });
    }

    discussion.replies.push({
      author: req.user._id,
      message: req.body.message
    });

    await discussion.save();

    const updated =
      await Discussion.findById(
        discussion._id
      )
        .populate(
          'author',
          'name avatar isVerified'
        )
        .populate(
          'replies.author',
          'name avatar'
        );

    return res.status(201).json({
      success: true,
      discussion: updated
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =====================
// REPORTS
// =====================

exports.reportContent = async (req, res) => {
  try {
    const {
      contentType,
      contentId,
      reason,
      description
    } = req.body;

    const report =
      await Report.create({
        reporter: req.user._id,
        contentType,
        contentId,
        reason,
        description
      });

    if (contentType === 'post') {
      await Post.findByIdAndUpdate(
        contentId,
        {
          isReported: true,
          $inc: {
            reportCount: 1
          }
        }
      );
    }

    return res.status(201).json({
      success: true,
      message: 'Content reported',
      report
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =====================
// GET CURRENT USER STATS
// =====================
exports.getUserStats = async (req, res) => {
  try {
    const stats =
      await calculateCommunityStats(
        req.user._id
      );

    return res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    console.error(
      'Community Stats Error:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        'Failed to load community statistics'
    });
  }
};