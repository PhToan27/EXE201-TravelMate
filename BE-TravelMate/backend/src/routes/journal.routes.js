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

// Protect all routes with auth check and premium check
router.use(protect);
router.use(premiumOnly);

// Route mappings:
// 1. Trip journals collection routes (under /api/trips/:tripId/journals)
router.route('/trips/:tripId/journals')
  .get(getJournalsByTrip)
  .post(upload.array('images[]', 20), createJournal);

// 2. Specific journal resource routes (under /api/journals/:id)
router.route('/journals/:id')
  .get(getJournalById)
  .put(upload.array('images[]', 20), updateJournal)
  .delete(deleteJournal);

module.exports = router;
