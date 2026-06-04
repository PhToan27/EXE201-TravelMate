const express = require('express');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const User = require('../models/User');
const {
  addComment,
  createPost,
  getPostById,
  getPosts,
  incrementShare,
  toggleFollowAuthor,
  toggleLikePost,
} = require('../controllers/post.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

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

router.get('/', optionalProtect, getPosts);
router.get('/:id', optionalProtect, getPostById);
router.post('/', protect, upload.single('image'), createPost);
router.post('/authors/:authorId/follow', protect, toggleFollowAuthor);
router.post('/:id/like', protect, toggleLikePost);
router.post('/:id/comments', protect, addComment);
router.post('/:id/share', incrementShare);

module.exports = router;
