const Offer = require('../models/offer.js');

// =====================
// GET ALL ACTIVE OFFERS (Public - For Homepage)
// =====================
exports.getActiveOffers = async (req, res) => {
  try {
    const offers = await Offer.find({ 
      isActive: true, 
      validTill: { $gte: new Date() } // Sirf wo jo expire nahi hue
    }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, offers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =====================
// GET ALL OFFERS (Admin)
// =====================
exports.getAllOffers = async (req, res) => {
  try {
    const offers = await Offer.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, offers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =====================
// CREATE NEW OFFER (Admin)
// =====================
exports.createOffer = async (req, res) => {
  try {
    const { code, title, description, discountPercentage, maxDiscountAmount, validTill } = req.body;

    const existing = await Offer.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: "Offer code already exists!" });
    }

    const offer = await Offer.create({
      code, title, description, discountPercentage, maxDiscountAmount, validTill
    });

    res.status(201).json({ success: true, message: "Offer created successfully", offer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =====================
// DELETE OFFER (Admin)
// =====================
exports.deleteOffer = async (req, res) => {
  try {
    await Offer.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Offer deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =====================
// APPLY PROMO CODE (User - During Payment)
// =====================
exports.applyPromoCode = async (req, res) => {
  try {
    const { code } = req.body;

    const offer = await Offer.findOne({ 
      code: code.toUpperCase(),
      isActive: true,
      validTill: { $gte: new Date() }
    });

    if (!offer) {
      return res.status(404).json({ success: false, message: "Invalid or expired promo code" });
    }

    res.status(200).json({ success: true, message: "Promo code applied!", offer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};