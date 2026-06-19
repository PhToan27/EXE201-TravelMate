const express = require('express');
const { getPlaceDetails, searchPlaces } = require('../controllers/place.controller');

const router = express.Router();

router.get('/search', searchPlaces);
router.get('/detail', getPlaceDetails);

module.exports = router;
