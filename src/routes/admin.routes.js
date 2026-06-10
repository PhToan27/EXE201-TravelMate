const express = require('express');
const {
  getStats,
  getUsers,
  updateUserStatus,
  updateUserRole,
  updateUserPackage,
  getPendingPosts,
  moderatePost,
  getSettings,
  updateSettings,
} = require('../controllers/admin.controller');
const { protect, adminProtect } = require('../middlewares/auth.middleware');

const router = express.Router();

// All admin dashboard APIs require authentication and admin role permission
router.use(protect);
router.use(adminProtect);

router.get('/stats', getStats);
router.get('/users', getUsers);
router.put('/users/:id/status', updateUserStatus);
router.put('/users/:id/package', updateUserPackage);
router.put('/users/:id/role', updateUserRole);
router.get('/posts', getPendingPosts);
router.post('/posts/:id/moderate', moderatePost);
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

module.exports = router;
