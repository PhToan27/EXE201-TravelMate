const express = require('express');
const { getPlaceDetails, getNearbyPlaces, searchPlaces } = require('../controllers/place.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

// Protect all routes under /api/places
router.use(protect);

router.get('/detail', getPlaceDetails);
router.get('/nearby', getNearbyPlaces);
router.get('/search', searchPlaces);

module.exports = router;

