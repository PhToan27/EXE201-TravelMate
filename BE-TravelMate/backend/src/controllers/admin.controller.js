const User = require('../models/User');
const Post = require('../models/Post');
const Trip = require('../models/Trip');
const AdminSetting = require('../models/AdminSetting');
const { grantPremiumMembership, revokePremiumMembership } = require('../services/membership.service');

/**
 * @desc    Get dashboard statistics
 * @route   GET /api/admin/stats
 * @access  Private/Admin
 */
const getStats = async (req, res) => {
  try {
    // 1. Total users count
    const totalUsers = await User.countDocuments({ role: { $ne: 'admin' } });
    const premiumUsers = await User.countDocuments({ package: 'premium', role: { $ne: 'admin' } });
    
    // 2. New trips this month (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newTripsCount = await Trip.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });

    // 3. Urgent reports / pending items count
    const pendingPostsCount = await Post.countDocuments({ status: 'pending' });
    const reportedPostsCount = await Post.countDocuments({
      reported: true,
      $or: [{ status: 'approved' }, { status: { $exists: false } }],
    });
    const approvedPostsCount = await Post.countDocuments({
      $or: [{ status: 'approved' }, { status: { $exists: false } }],
    });
    const urgentReports = pendingPostsCount + reportedPostsCount;

    // 4. User growth trend (mock dynamic user growth for charts based on real counts)
    // To ensure the chart looks professional and full like in the screenshots:
    // We'll calculate registrations in the last 4 weeks
    const userGrowth = [];
    for (let i = 3; i >= 0; i--) {
      const start = new Date();
      start.setDate(start.getDate() - (i + 1) * 7);
      const end = new Date();
      end.setDate(end.getDate() - i * 7);

      const count = await User.countDocuments({
        createdAt: { $gte: start, $lt: end },
        role: { $ne: 'admin' },
      });
      userGrowth.push({
        label: i === 0 ? 'Hôm nay' : `Tuần ${4 - i}`,
        value: count,
      });
    }

    // 5. Recent community posts for quick review
    const recentPending = await Post.find({
      $or: [
        { status: 'pending' },
        { reported: true, $or: [{ status: 'approved' }, { status: { $exists: false } }] },
      ],
    })
      .populate('author', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    return res.json({
      success: true,
      data: {
        totalUsers,
        premiumUsers,
        newTrips: newTripsCount,
        urgentReports,
        pendingCount: pendingPostsCount,
        approvedCount: approvedPostsCount,
        reportedCount: reportedPostsCount,
        userGrowth,
        recentPending,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get all users with filter & search & pagination
 * @route   GET /api/admin/users
 * @access  Private/Admin
 */
const getUsers = async (req, res) => {
  try {
    const { q, packageType, status, page = 1, limit = 10 } = req.query;
    const query = { role: { $ne: 'admin' } };

    // Search query
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ];
    }

    // Filters
    if (packageType && packageType !== 'all') {
      query.package = packageType;
    }
    if (status && status !== 'all') {
      query.status = status;
    }

    const skipIndex = (page - 1) * limit;

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip(skipIndex);

    const total = await User.countDocuments(query);

    return res.json({
      success: true,
      data: {
        users,
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update user status (block/unblock)
 * @route   PUT /api/admin/users/:id/status
 * @access  Private/Admin
 */
const updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.status = status;
    await user.save();

    return res.json({
      success: true,
      message: `User status updated to ${status}`,
      data: { _id: user._id, status: user.status },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update user package (Free/Premium)
 * @route   PUT /api/admin/users/:id/package
 * @access  Private/Admin
 */
const updateUserPackage = async (req, res) => {
  try {
    const { package: pkg } = req.body;
    if (!['free', 'premium'].includes(pkg)) {
      return res.status(400).json({ success: false, message: 'Invalid package type' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (pkg === 'premium') {
      await grantPremiumMembership(user);
    } else {
      await revokePremiumMembership(user);
    }

    return res.json({
      success: true,
      message: `User package updated to ${pkg}`,
      data: {
        _id: user._id,
        package: user.package,
        premiumExpiresAt: user.premiumExpiresAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update user administrative role
 * @route   PUT /api/admin/users/:id/role
 * @access  Private/Admin
 */
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin', 'moderator', 'analyst'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.role = role;
    await user.save();

    return res.json({
      success: true,
      message: `User role updated to ${role}`,
      data: { _id: user._id, role: user.role },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get pending/moderated/reported posts
 * @route   GET /api/admin/posts
 * @access  Private/Admin
 */
const getPendingPosts = async (req, res) => {
  try {
    const { tab = 'pending', page = 1, limit = 10 } = req.query;
    const query = {};

    if (tab === 'pending') {
      query.status = 'pending';
    } else if (tab === 'approved') {
      query.$or = [{ status: 'approved' }, { status: { $exists: false } }];
    } else if (tab === 'reported') {
      query.reported = true;
      query.$or = [{ status: 'approved' }, { status: { $exists: false } }];
    }

    const skipIndex = (page - 1) * limit;

    const posts = await Post.find(query)
      .populate('author', 'name email')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip(skipIndex);

    const total = await Post.countDocuments(query);

    return res.json({
      success: true,
      data: {
        posts,
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Moderate a post (approve/reject/clear flags)
 * @route   POST /api/admin/posts/:id/moderate
 * @access  Private/Admin
 */
const moderatePost = async (req, res) => {
  try {
    const { action } = req.body; // 'approve', 'reject', 'clear_report'
    
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    if (action === 'approve') {
      post.status = 'approved';
    } else if (action === 'reject') {
      post.status = 'rejected';
    } else if (action === 'clear_report') {
      post.reported = false;
    } else {
      return res.status(400).json({ success: false, message: 'Invalid moderation action' });
    }

    await post.save();

    return res.json({
      success: true,
      message: `Post moderated successfully with action: ${action}`,
      data: post,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get system settings
 * @route   GET /api/admin/settings
 * @access  Private/Admin
 */
const getSettings = async (req, res) => {
  try {
    let settings = await AdminSetting.findOne();
    if (!settings) {
      settings = await AdminSetting.create({});
    }

    // Also get lists of admins for role management screen
    const admins = await User.find({ role: { $in: ['admin', 'moderator', 'analyst'] } })
      .select('name email role status')
      .sort({ role: 1 });

    return res.json({
      success: true,
      data: {
        settings,
        admins,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update system settings
 * @route   PUT /api/admin/settings
 * @access  Private/Admin
 */
const updateSettings = async (req, res) => {
  try {
    const {
      premiumIndividualPrice,
      premiumFamilyPrice,
      isNotificationEnabled,
      isDailyReportEnabled,
      emailReportRecipient,
      notificationFrequency,
    } = req.body;

    let settings = await AdminSetting.findOne();
    if (!settings) {
      settings = new AdminSetting();
    }

    if (premiumIndividualPrice !== undefined) settings.premiumIndividualPrice = premiumIndividualPrice;
    if (premiumFamilyPrice !== undefined) settings.premiumFamilyPrice = premiumFamilyPrice;
    if (isNotificationEnabled !== undefined) settings.isNotificationEnabled = isNotificationEnabled;
    if (isDailyReportEnabled !== undefined) settings.isDailyReportEnabled = isDailyReportEnabled;
    if (emailReportRecipient !== undefined) settings.emailReportRecipient = emailReportRecipient;
    if (notificationFrequency !== undefined) settings.notificationFrequency = notificationFrequency;

    await settings.save();

    return res.json({
      success: true,
      message: 'System settings updated successfully',
      data: settings,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getStats,
  getUsers,
  updateUserStatus,
  updateUserRole,
  updateUserPackage,
  getPendingPosts,
  moderatePost,
  getSettings,
  updateSettings,
};
