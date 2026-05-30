const express = require('express');
const { getLocationCoordinates, getRouteDetails } = require('../controllers/map.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(protect); // Protect all routes in this file

router.get('/geocode', getLocationCoordinates);
router.get('/distance', getRouteDetails);

module.exports = router;
