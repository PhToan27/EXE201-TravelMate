const cloudinary = require('cloudinary').v2;
const ModerationLog = require('../models/ModerationLog');
const Notification = require('../models/Notification');
const Post = require('../models/Post');
const User = require('../models/User');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const bannedWords = [
  'địt', 'đụ', 'lồn', 'cặc', 'dm', 'đm', 'fuck', 'shit', 'bitch',
  'ngu', 'óc chó', 'spam', 'http://', 'https://',
];

const severeWords = ['giết', 'kill yourself', 'khủng bố', 'terrorist'];

const buildExcerpt = (content) => {
  if (!content) return '';
  return content.length > 180 ? `${content.slice(0, 177)}...` : content;
};

const createNotification = async ({ recipient, actor, post, type, message }) => {
  if (!recipient || (actor && String(recipient) === String(actor))) return null;
  return Notification.create({ recipient, actor, post, type, message });
};

const moderateText = ({ title = '', content = '' }) => {
  const text = `${title} ${content}`.toLowerCase();
  const reasons = [];

  bannedWords.forEach((word) => {
    if (text.includes(word)) reasons.push(`Từ khóa không phù hợp: ${word}`);
  });

  const severeHit = severeWords.find((word) => text.includes(word));
  if (severeHit) {
    return {
      status: 'rejected',
      moderation: {
        status: 'rejected',
        severity: 'high',
        reasons: [`Vi phạm nghiêm trọng: ${severeHit}`],
        provider: 'basic-rule',
      },
      rejectionReason: 'Nội dung vi phạm nghiêm trọng quy tắc cộng đồng.',
    };
  }

  if (reasons.length) {
    return {
      status: 'pending',
      moderation: {
        status: 'flagged',
        severity: 'medium',
        reasons,
        provider: 'basic-rule',
      },
      rejectionReason: '',
    };
  }

  return {
    status: 'pending',
    moderation: {
      status: 'needs_review',
      severity: 'none',
      reasons: ['Chờ admin phê duyệt trước khi hiển thị công khai.'],
      provider: 'basic-rule',
    },
    rejectionReason: '',
  };
};

const getPopulatedPost = (id) => (
  Post.findById(id)
    .populate('author', 'name email following followers role')
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
    followersCount: plain.author?.followers?.length || 0,
    followingCount: plain.author?.following?.length || 0,
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
    const query = req.user?._id
      ? {
          $or: [
            { status: 'approved' },
            { author: req.user._id, status: { $in: ['pending', 'rejected'] } },
          ],
        }
      : { status: 'approved' };

    const posts = await Post.find(query)
      .populate('author', 'name email following followers role')
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

const getMyPosts = async (req, res) => {
  try {
    const posts = await Post.find({ author: req.user._id })
      .populate('author', 'name email following followers role')
      .populate('comments.author', 'name email')
      .sort({ createdAt: -1 });

    return res.json({ success: true, data: posts.map((post) => formatPost(post, req.user)) });
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

    const canView =
      post.status === 'approved' ||
      String(post.author._id) === String(req.user?._id) ||
      ['admin', 'moderator'].includes(req.user?.role);

    if (!canView) {
      return res.status(403).json({ success: false, message: 'Post is not public yet' });
    }

    return res.json({ success: true, data: formatPost(post, req.user) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createPost = async (req, res) => {
  try {
    const { title, excerpt, content, category } = req.body;

    if (req.user.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Tài khoản đang bị hạn chế đăng bài.' });
    }

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Please add title and content' });
    }

    let imageUrl = req.body.imageUrl;
    let imagePublicId;
    let uploadWarning = '';

    if (req.file) {
      try {
        const uploadResult = await uploadImage(req.file);
        imageUrl = uploadResult.secure_url;
        imagePublicId = uploadResult.public_id;
      } catch (uploadError) {
        if (uploadError.message === 'Cloudinary environment variables are missing') {
          uploadWarning = 'Anh chua duoc luu vi server chua cau hinh Cloudinary.';
        } else {
        return res.status(400).json({
          success: false,
          message: uploadError.message || 'Không thể tải ảnh bài viết. Vui lòng thử ảnh khác.',
        });
      }
    }

    }

    const moderationResult = moderateText({ title, content });
    const imageReviewReason = imageUrl && req.file && !process.env.IMAGE_MODERATION_PROVIDER
      ? 'Ảnh đã upload, chờ admin kiểm tra thủ công vì chưa cấu hình image moderation provider.'
      : null;

    if (uploadWarning) {
      moderationResult.moderation.reasons.push(uploadWarning);
    }

    if (imageReviewReason) {
      moderationResult.moderation.reasons.push(imageReviewReason);
      moderationResult.moderation.status = moderationResult.moderation.status === 'rejected'
        ? 'rejected'
        : 'needs_review';
    }

    const post = await Post.create({
      title,
      excerpt: excerpt || buildExcerpt(content),
      content,
      category,
      imageUrl,
      imagePublicId,
      author: req.user._id,
      status: moderationResult.status,
      rejectionReason: moderationResult.rejectionReason,
      moderation: moderationResult.moderation,
    });

    await ModerationLog.create({
      post: post._id,
      user: req.user._id,
      action: post.status === 'rejected' ? 'auto_rejected' : 'auto_pending',
      status: post.status,
      severity: post.moderation.severity,
      reasons: post.moderation.reasons,
      provider: post.moderation.provider,
    });

    await createNotification({
      recipient: req.user._id,
      actor: req.user._id,
      post: post._id,
      type: post.status === 'rejected' ? 'post_rejected' : 'post_pending',
      message: post.status === 'rejected'
        ? 'Bài viết của bạn bị từ chối tự động do vi phạm quy tắc cộng đồng.'
        : 'Bài viết của bạn đang được phê duyệt.',
    });

    const populatedPost = await getPopulatedPost(post._id);
    return res.status(201).json({
      success: true,
      message: post.status === 'rejected'
        ? 'Bài viết của bạn bị từ chối do vi phạm quy tắc cộng đồng.'
        : 'Bài viết của bạn đang được phê duyệt',
      data: formatPost(populatedPost, req.user),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const toggleLikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('author', 'name');
    if (!post || post.status !== 'approved') {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const userId = String(req.user._id);
    const hasLiked = post.likes.some((id) => String(id) === userId);

    if (hasLiked) {
      post.likes = post.likes.filter((id) => String(id) !== userId);
    } else {
      post.likes.push(req.user._id);
      await createNotification({
        recipient: post.author._id,
        actor: req.user._id,
        post: post._id,
        type: 'like',
        message: `${req.user.name} đã thích bài viết "${post.title}".`,
      });
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

    const post = await Post.findById(req.params.id).populate('author', 'name');
    if (!post || post.status !== 'approved') {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    post.comments.push({
      author: req.user._id,
      content: content.trim(),
    });

    await post.save();
    await createNotification({
      recipient: post.author._id,
      actor: req.user._id,
      post: post._id,
      type: 'comment',
      message: `${req.user.name} đã bình luận "${content.trim()}" ở bài viết "${post.title}".`,
    });

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
      author.followers = author.followers.filter((id) => String(id) !== String(req.user._id));
    } else {
      user.following.push(authorId);
      author.followers.push(req.user._id);
      await createNotification({
        recipient: authorId,
        actor: req.user._id,
        type: 'follow',
        message: `${req.user.name} đã theo dõi bạn.`,
      });
    }

    await user.save();
    await author.save();

    return res.json({
      success: true,
      data: {
        authorId,
        isFollowing: !isFollowing,
        followingCount: user.following.length,
        followersCount: author.followers.length,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate('actor', 'name email')
      .populate('post', 'title status')
      .sort({ createdAt: -1 })
      .limit(100);
    return res.json({ success: true, data: notifications });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { read: true },
      { new: true }
    );
    return res.json({ success: true, data: notification });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('name email following followers role createdAt')
      .populate('following', 'name email')
      .populate('followers', 'name email');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const posts = await Post.find({
      author: user._id,
      status: 'approved',
    })
      .populate('author', 'name email following followers role')
      .sort({ createdAt: -1 });

    const isFollowing = req.user
      ? user.followers.some((id) => String(id._id || id) === String(req.user._id))
      : false;

    return res.json({
      success: true,
      data: {
        user: {
          ...user.toObject(),
          followersCount: user.followers.length,
          followingCount: user.following.length,
          isFollowing,
        },
        posts: posts.map((post) => formatPost(post, req.user)),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getAdminPosts = async (req, res) => {
  try {
    const { status, reported } = req.query;
    const query = {};
    if (status) query.status = status;
    if (reported === 'true') query.reported = true;

    const posts = await Post.find(query)
      .populate('author', 'name email status role')
      .populate('comments.author', 'name email')
      .sort({ createdAt: -1 })
      .limit(100);

    return res.json({ success: true, data: posts.map((post) => formatPost(post, req.user)) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updatePostStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const post = await Post.findById(req.params.id).populate('author', 'name email');
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    post.status = status;
    post.rejectionReason = status === 'rejected' ? reason || 'Bài viết không phù hợp quy tắc cộng đồng.' : '';
    post.moderation.status = status === 'approved' ? 'passed' : 'rejected';
    await post.save();

    await ModerationLog.create({
      post: post._id,
      user: post.author._id,
      action: status === 'approved' ? 'admin_approved' : 'admin_rejected',
      status,
      severity: status === 'approved' ? 'none' : 'medium',
      reasons: reason ? [reason] : [],
      provider: 'admin',
      note: `${req.user.name} ${status} post`,
    });

    await createNotification({
      recipient: post.author._id,
      actor: req.user._id,
      post: post._id,
      type: status === 'approved' ? 'post_approved' : 'post_rejected',
      message: status === 'approved'
        ? `Bài viết "${post.title}" đã được duyệt.`
        : `Bài viết "${post.title}" bị từ chối: ${post.rejectionReason}`,
    });

    const populatedPost = await getPopulatedPost(post._id);
    return res.json({ success: true, data: formatPost(populatedPost, req.user) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const reportPost = async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(req.params.id, { reported: true }, { new: true });
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    return res.json({ success: true, data: post });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
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
};
