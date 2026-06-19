const express = require('express');
const { getPlaceDetails, searchPlaces } = require('../controllers/place.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

// Protect all routes under /api/places
router.use(protect);

router.get('/search', searchPlaces);
router.get('/detail', getPlaceDetails);

module.exports = router;
