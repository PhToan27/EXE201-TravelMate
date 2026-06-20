const express = require('express');
const { getWeatherForecast } = require('../controllers/weather.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(protect);

router.get('/', getWeatherForecast);

module.exports = router;
