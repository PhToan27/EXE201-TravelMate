const express = require('express');
const {
  createPremiumPayment,
  syncPremiumPaymentStatus,
  cancelPremiumPayment,
  handlePayosWebhook,
} = require('../controllers/payment.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/payos/webhook', handlePayosWebhook);
router.post('/payos/premium', protect, createPremiumPayment);
router.get('/payos/:orderCode', protect, syncPremiumPaymentStatus);
router.post('/payos/:orderCode/cancel', protect, cancelPremiumPayment);

module.exports = router;
