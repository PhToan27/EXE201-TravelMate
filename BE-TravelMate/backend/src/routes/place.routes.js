const express = require('express');
const { getPlaceDetails } = require('../controllers/place.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

// Protect all routes under /api/places
router.use(protect);

router.get('/detail', getPlaceDetails);

module.exports = router;
