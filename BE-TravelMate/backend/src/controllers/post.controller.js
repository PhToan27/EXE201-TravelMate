const cloudinary = require('cloudinary').v2;
const Post = require('../models/Post');
const User = require('../models/User');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const buildExcerpt = (content) => {
  if (!content) return '';
  return content.length > 180 ? `${content.slice(0, 177)}...` : content;
};

const getPopulatedPost = (id) => (
  Post.findById(id)
    .populate('author', 'name email following')
    .populate('comments.author', 'name email')
);

const formatPost = (post, viewer) => {
  const plain = typeof post.toObject === 'function' ? post.toObject() : post;
  const likes = plain.likes || [];
  const comments = plain.comments || [];
  const viewerId = viewer?._id || viewer;
  const viewerFollowing = viewer?.following || [];

  return {
    ...plain,
    likesCount: Array.isArray(likes) ? likes.length : Number(likes || 0),
    commentsCount: Array.isArray(comments) ? comments.length : Number(comments || 0),
    sharesCount: plain.shares || 0,
    isLiked: viewerId ? likes.some((id) => String(id) === String(viewerId)) : false,
    isFollowingAuthor: viewerId && plain.author?._id
      ? viewerFollowing.some((id) => String(id) === String(plain.author._id))
      : false,
  };
};

const uploadImage = (file) => new Promise((resolve, reject) => {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    reject(new Error('Cloudinary environment variables are missing'));
    return;
  }

  const stream = cloudinary.uploader.upload_stream(
    {
      folder: 'travelmate/posts',
      resource_type: 'image',
    },
    (error, result) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(result);
    }
  );

  stream.end(file.buffer);
});

const getPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('author', 'name email following')
      .populate('comments.author', 'name email')
      .sort({ createdAt: -1 })
      .limit(50);

    return res.json({
      success: true,
      data: posts.map((post) => formatPost(post, req.user)),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getPostById = async (req, res) => {
  try {
    const post = await getPopulatedPost(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    return res.json({ success: true, data: formatPost(post, req.user) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createPost = async (req, res) => {
  try {
    const { title, excerpt, content, category } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Please add title and content' });
    }

    let imageUrl = req.body.imageUrl;
    let imagePublicId;

    if (req.file) {
      const uploadResult = await uploadImage(req.file);
      imageUrl = uploadResult.secure_url;
      imagePublicId = uploadResult.public_id;
    }

    const post = await Post.create({
      title,
      excerpt: excerpt || buildExcerpt(content),
      content,
      category,
      imageUrl,
      imagePublicId,
      author: req.user._id,
    });

    const populatedPost = await getPopulatedPost(post._id);
    return res.status(201).json({ success: true, data: formatPost(populatedPost, req.user) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const toggleLikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const userId = String(req.user._id);
    const hasLiked = post.likes.some((id) => String(id) === userId);

    if (hasLiked) {
      post.likes = post.likes.filter((id) => String(id) !== userId);
    } else {
      post.likes.push(req.user._id);
    }

    await post.save();
    const populatedPost = await getPopulatedPost(post._id);
    return res.json({ success: true, data: formatPost(populatedPost, req.user) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const addComment = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) {
      return res.status(400).json({ success: false, message: 'Please add comment content' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    post.comments.push({
      author: req.user._id,
      content: content.trim(),
    });

    await post.save();
    const populatedPost = await getPopulatedPost(post._id);
    return res.status(201).json({ success: true, data: formatPost(populatedPost, req.user) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const incrementShare = async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $inc: { shares: 1 } },
      { new: true }
    );

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const populatedPost = await getPopulatedPost(post._id);
    return res.json({ success: true, data: formatPost(populatedPost, req.user) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const toggleFollowAuthor = async (req, res) => {
  try {
    const { authorId } = req.params;

    if (String(authorId) === String(req.user._id)) {
      return res.status(400).json({ success: false, message: 'You cannot follow yourself' });
    }

    const author = await User.findById(authorId);
    if (!author) {
      return res.status(404).json({ success: false, message: 'Author not found' });
    }

    const user = await User.findById(req.user._id);
    const isFollowing = user.following.some((id) => String(id) === String(authorId));

    if (isFollowing) {
      user.following = user.following.filter((id) => String(id) !== String(authorId));
    } else {
      user.following.push(authorId);
    }

    await user.save();

    return res.json({
      success: true,
      data: {
        authorId,
        isFollowing: !isFollowing,
        followingCount: user.following.length,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getPosts,
  getPostById,
  createPost,
  toggleLikePost,
  addComment,
  incrementShare,
  toggleFollowAuthor,
};
