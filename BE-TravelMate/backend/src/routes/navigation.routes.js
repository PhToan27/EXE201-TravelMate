const express = require('express');
const { getNavigationToPlace, getNavigationEstimate } = require('../controllers/navigation.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(protect);

router.get('/place/:placeId', getNavigationToPlace);
router.get('/estimate', getNavigationEstimate);

module.exports = router;

