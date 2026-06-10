const express = require('express');
const {
  createTrip,
  getTrips,
  getTripById,
  updateTrip,
  getPackingList,
  updatePackingList,
  deleteTrip,
  shareTrip,
  getSharedTrip,
} = require('../controllers/trip.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

// Public routes (No authentication required)
router.get('/shared/:shareCode', getSharedTrip);

// Protected routes (JWT authentication required)
router.use(protect);

router.route('/')
  .get(getTrips)
  .post(createTrip);

router.route('/:id')
  .get(getTripById)
  .put(updateTrip)
  .delete(deleteTrip);

router.route('/:id/packing-list')
  .get(getPackingList)
  .put(updatePackingList);

router.post('/:id/share', shareTrip);

module.exports = router;
