const express = require('express');
const { registerUser, loginUser, getUserProfile, googleLogin, upgradePackage } = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleLogin);
router.get('/profile', protect, getUserProfile);
router.put('/upgrade', protect, upgradePackage);

module.exports = router;
