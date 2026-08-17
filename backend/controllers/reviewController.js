const Review = require('../models/Review.js');
const Booking = require('../models/Booking.js');
const Bus = require('../models/bus.js');

const MIN_REVIEW_LENGTH = 20;
const REPORT_HIDE_LIMIT = 3;
const TRUSTED_HELPFUL_LIMIT = 5;

function isJourneyCompleted(journeyDate) {
  if (!journeyDate) return false;

  const journey = new Date(journeyDate);
  const today = new Date();

  today.setHours(23, 59, 59, 999);

  return journey <= today;
}

function getRouteKey(bus) {
  return `${bus.source}-${bus.destination}`.toLowerCase().trim();
}

// ================================
// GET ROUTE REVIEWS
// GET /api/reviews/route/:busId
// ================================
exports.getRouteReviews = async (req, res) => {
  try {
    const { busId } = req.params;

    const reviews = await Review.find({
      bus: busId,
      status: "active"
    })
      .populate("user", "name avatar isVerified")
      .sort({ createdAt: -1 });

    const totalReviews = reviews.length;

    const averageRating =
      totalReviews > 0
        ? Number(
            (
              reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
            ).toFixed(1)
          )
        : 0;

    const formattedReviews = reviews.map((review) => ({
      _id: review._id,
      user: review.user,
      booking: review.booking,
      bus: review.bus,
      rating: review.rating,
      reviewText: review.reviewText,
      helpfulCount: review.helpfulBy.length,
      helpfulBy: review.helpfulBy,
      reportCount: review.reportCount,
      status: review.status,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      isTrustedReviewer: review.helpfulBy.length >= TRUSTED_HELPFUL_LIMIT
    }));

    res.status(200).json({
      success: true,
      averageRating,
      totalReviews,
      reviews: formattedReviews
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ================================
// GET ELIGIBLE BOOKINGS FOR REVIEW
// GET /api/reviews/eligible/:busId
// ================================
exports.getEligibleBookings = async (req, res) => {
  try {
    const { busId } = req.params;

    const bookings = await Booking.find({
      user: req.user.id,
      bus: busId,
      bookingStatus: "Confirmed"
    })
      .populate("bus")
      .sort({ journeyDate: -1 });

    const completedBookings = bookings.filter((booking) =>
      isJourneyCompleted(booking.journeyDate)
    );

    const reviewedBookings = await Review.find({
      user: req.user.id,
      bus: busId
    }).select("booking");

    const reviewedBookingIds = reviewedBookings.map((r) =>
      r.booking.toString()
    );

    const eligibleBookings = completedBookings.filter(
      (booking) => !reviewedBookingIds.includes(booking._id.toString())
    );

    res.status(200).json({
      success: true,
      eligibleBookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ================================
// CREATE REVIEW
// POST /api/reviews
// ================================
exports.createReview = async (req, res) => {
  try {
    if (!req.user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Only verified users can post reviews."
      });
    }

    const { bookingId, rating, reviewText } = req.body;

    if (!bookingId || !rating || !reviewText) {
      return res.status(400).json({
        success: false,
        message: "Booking, rating and review text are required."
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5."
      });
    }

    if (reviewText.trim().length < MIN_REVIEW_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Review must be at least ${MIN_REVIEW_LENGTH} characters long.`
      });
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      user: req.user.id
    }).populate("bus");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found."
      });
    }

    if (booking.bookingStatus !== "Confirmed") {
      return res.status(400).json({
        success: false,
        message: "Only confirmed journeys can be reviewed."
      });
    }

    if (!isJourneyCompleted(booking.journeyDate)) {
      return res.status(400).json({
        success: false,
        message: "You can review only after completing your journey."
      });
    }

    const existingReview = await Review.findOne({
      user: req.user.id,
      booking: booking._id
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this journey."
      });
    }

    const bus = booking.bus;

    const review = await Review.create({
      user: req.user.id,
      booking: booking._id,
      bus: bus._id,
      routeKey: getRouteKey(bus),
      rating,
      reviewText: reviewText.trim()
    });

    const populatedReview = await Review.findById(review._id)
      .populate("user", "name avatar isVerified");

    res.status(201).json({
      success: true,
      message: "Review submitted successfully.",
      review: populatedReview
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this journey."
      });
    }

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ================================
// UPDATE REVIEW WITHIN 24 HOURS
// PUT /api/reviews/:id
// ================================
exports.updateReview = async (req, res) => {
  try {
    const { rating, reviewText } = req.body;

    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found."
      });
    }

    if (review.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to edit this review."
      });
    }

    const hoursPassed =
      (Date.now() - new Date(review.createdAt).getTime()) / (1000 * 60 * 60);

    if (hoursPassed > 24) {
      return res.status(403).json({
        success: false,
        message: "Reviews can only be edited within 24 hours."
      });
    }

    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: "Rating must be between 1 and 5."
        });
      }

      review.rating = rating;
    }

    if (reviewText !== undefined) {
      if (reviewText.trim().length < MIN_REVIEW_LENGTH) {
        return res.status(400).json({
          success: false,
          message: `Review must be at least ${MIN_REVIEW_LENGTH} characters long.`
        });
      }

      review.reviewText = reviewText.trim();
    }

    await review.save();

    const updatedReview = await Review.findById(review._id)
      .populate("user", "name avatar isVerified");

    res.status(200).json({
      success: true,
      message: "Review updated successfully.",
      review: updatedReview
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ================================
// MARK REVIEW HELPFUL
// PUT /api/reviews/:id/helpful
// ================================
exports.markHelpful = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review || review.status !== "active") {
      return res.status(404).json({
        success: false,
        message: "Review not found."
      });
    }

    if (review.user.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "You cannot mark your own review as helpful."
      });
    }

    const alreadyHelpful = review.helpfulBy.some(
      (id) => id.toString() === req.user.id
    );

    if (!alreadyHelpful) {
      review.helpfulBy.push(req.user.id);
      await review.save();
    }

    res.status(200).json({
      success: true,
      helpfulCount: review.helpfulBy.length,
      isTrustedReviewer: review.helpfulBy.length >= TRUSTED_HELPFUL_LIMIT
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ================================
// REPORT REVIEW
// PUT /api/reviews/:id/report
// ================================
exports.reportReview = async (req, res) => {
  try {
    const { reason = "other" } = req.body;

    const review = await Review.findById(req.params.id);

    if (!review || review.status !== "active") {
      return res.status(404).json({
        success: false,
        message: "Review not found."
      });
    }

    const alreadyReported = review.reports.some(
      (r) => r.user.toString() === req.user.id
    );

    if (alreadyReported) {
      return res.status(400).json({
        success: false,
        message: "You have already reported this review."
      });
    }

    review.reports.push({
      user: req.user.id,
      reason
    });

    review.reportCount = review.reports.length;

    if (review.reportCount >= REPORT_HIDE_LIMIT) {
      review.status = "hidden";
    }

    await review.save();

    res.status(200).json({
      success: true,
      message:
        review.status === "hidden"
          ? "Review has been hidden after multiple reports."
          : "Review reported successfully.",
      reviewStatus: review.status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};