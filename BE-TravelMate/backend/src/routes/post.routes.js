const express = require('express');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const User = require('../models/User');
const {
  addComment,
  createPost,
  getAdminPosts,
  getMyPosts,
  getNotifications,
  getPostById,
  getPosts,
  getUserProfile,
  incrementShare,
  markNotificationRead,
  reportPost,
  toggleFollowAuthor,
  toggleLikePost,
  updatePostStatus,
} = require('../controllers/post.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

const uploadPostImage = (req, res, next) => {
  upload.single('image')(req, res, (error) => {
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Không thể đọc ảnh bài viết.',
      });
    }
    return next();
  });
};

const optionalProtect = async (req, res, next) => {
  if (!req.headers.authorization?.startsWith('Bearer')) {
    return next();
  }

  try {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
  } catch {
    req.user = null;
  }

  return next();
};

const requireModerator = (req, res, next) => {
  if (!['admin', 'moderator'].includes(req.user?.role)) {
    return res.status(403).json({ success: false, message: 'Admin/moderator only' });
  }
  return next();
};

router.get('/me/posts', protect, getMyPosts);
router.get('/notifications', protect, getNotifications);
router.patch('/notifications/:id/read', protect, markNotificationRead);
router.get('/users/:id', optionalProtect, getUserProfile);

router.get('/admin/posts', protect, requireModerator, getAdminPosts);
router.patch('/admin/posts/:id/status', protect, requireModerator, updatePostStatus);

router.get('/', optionalProtect, getPosts);
router.get('/:id', optionalProtect, getPostById);
router.post('/', protect, uploadPostImage, createPost);
router.post('/authors/:authorId/follow', protect, toggleFollowAuthor);
router.post('/:id/like', protect, toggleLikePost);
router.post('/:id/comments', protect, addComment);
router.post('/:id/share', incrementShare);
router.post('/:id/report', protect, reportPost);

module.exports = router;
