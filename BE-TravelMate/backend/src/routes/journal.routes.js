const express = require('express');
const multer = require('multer');
const {
  getJournalsByTrip,
  getJournalById,
  createJournal,
  updateJournal,
  deleteJournal,
} = require('../controllers/journal.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

// Multer storage configuration (in-memory storage for Cloudinary stream)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per image
  },
});

// Middleware to restrict access to Premium users only
const premiumOnly = (req, res, next) => {
  if (req.user && req.user.package === 'premium') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Premium subscription required',
    });
  }
};

// Route mappings:
// 1. Trip journals collection routes (under /api/trips/:tripId/journals)
router.route('/trips/:tripId/journals')
  .get(protect, premiumOnly, getJournalsByTrip)
  .post(protect, premiumOnly, upload.array('images[]', 20), createJournal);

// 2. Specific journal resource routes (under /api/journals/:id)
router.route('/journals/:id')
  .get(protect, premiumOnly, getJournalById)
  .put(protect, premiumOnly, upload.array('images[]', 20), updateJournal)
  .delete(protect, premiumOnly, deleteJournal);

module.exports = router;
