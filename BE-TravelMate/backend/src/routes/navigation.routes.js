const express = require('express');
const { getNavigationToPlace } = require('../controllers/navigation.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(protect);

router.get('/place/:placeId', getNavigationToPlace);

module.exports = router;
