const express = require('express');
const { getPreview } = require('../controllers/itinerary-preview.controller');

const router = express.Router();

// Không lưu chuyến đi; người dùng có thể gọi để xem thử trước khi quyết định tạo chuyến đi thật.
router.post('/', getPreview);

module.exports = router;
