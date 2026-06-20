const Journal = require('../models/Journal');
const Trip = require('../models/Trip');
const cloudinary = require('cloudinary').v2;

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper function to upload buffer to Cloudinary
const uploadImage = (file) => new Promise((resolve, reject) => {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    reject(new Error('Cloudinary environment variables are missing'));
    return;
  }

  const stream = cloudinary.uploader.upload_stream(
    {
      folder: 'travelmate/journals',
      resource_type: 'image',
    },
    (error, result) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(result.secure_url);
    }
  );

  stream.end(file.buffer);
});

/**
 * @desc    Get all journal entries for a specific trip
 * @route   GET /api/trips/:tripId/journals
 * @access  Private (Premium)
 */
const getJournalsByTrip = async (req, res) => {
  try {
    const { tripId } = req.params;

    // Check if trip exists and belongs to the user
    const trip = await Trip.findOne({ _id: tripId, userId: req.user._id });
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chuyến đi tương thích với người dùng này.',
      });
    }

    const journals = await Journal.find({ tripId, userId: req.user._id }).sort({ journalDate: 1 });

    return res.json({
      success: true,
      data: journals,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get a single journal entry by ID
 * @route   GET /api/journals/:id
 * @access  Private (Premium)
 */
const getJournalById = async (req, res) => {
  try {
    const { id } = req.params;
    const journal = await Journal.findById(id).populate('tripId', 'destination startDate endDate');

    if (!journal) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhật ký này.',
      });
    }

    // Verify ownership
    if (String(journal.userId) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem nhật ký này.',
      });
    }

    return res.json({
      success: true,
      data: journal,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Create a new journal entry
 * @route   POST /api/trips/:tripId/journals
 * @access  Private (Premium)
 */
const createJournal = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { title, content, emotion, journalDate } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ các thông tin bắt buộc (title, content).',
      });
    }

    // Verify trip ownership
    const trip = await Trip.findOne({ _id: tripId, userId: req.user._id });
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chuyến đi tương thích với người dùng này.',
      });
    }

    // Process files if uploaded
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(file => uploadImage(file));
      imageUrls = await Promise.all(uploadPromises);
    }

    const journal = await Journal.create({
      tripId,
      userId: req.user._id,
      title,
      content,
      emotion: emotion || '',
      imageUrls,
      journalDate: journalDate ? new Date(journalDate) : new Date(),
    });

    return res.status(201).json({
      success: true,
      data: journal,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Update a journal entry
 * @route   PUT /api/journals/:id
 * @access  Private (Premium)
 */
const updateJournal = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, emotion, journalDate, keepImages } = req.body;

    const journal = await Journal.findById(id);
    if (!journal) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhật ký này.',
      });
    }

    // Verify ownership
    if (String(journal.userId) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền chỉnh sửa nhật ký của người khác.',
      });
    }

    // Determine which existing images to keep
    let updatedImageUrls = [];
    if (keepImages !== undefined) {
      try {
        updatedImageUrls = typeof keepImages === 'string' ? JSON.parse(keepImages) : keepImages;
      } catch (e) {
        updatedImageUrls = typeof keepImages === 'string' ? keepImages.split(',').filter(Boolean) : [];
      }
    } else {
      updatedImageUrls = journal.imageUrls || [];
    }

    // Upload new images if any
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(file => uploadImage(file));
      const newUrls = await Promise.all(uploadPromises);
      updatedImageUrls = [...updatedImageUrls, ...newUrls];
    }

    if (title) journal.title = title;
    if (content) journal.content = content;
    if (emotion !== undefined) journal.emotion = emotion;
    if (journalDate) journal.journalDate = new Date(journalDate);
    journal.imageUrls = updatedImageUrls;

    await journal.save();

    return res.json({
      success: true,
      data: journal,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Delete a journal entry
 * @route   DELETE /api/journals/:id
 * @access  Private (Premium)
 */
const deleteJournal = async (req, res) => {
  try {
    const { id } = req.params;

    const journal = await Journal.findById(id);
    if (!journal) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhật ký này.',
      });
    }

    // Verify ownership
    if (String(journal.userId) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xóa nhật ký của người khác.',
      });
    }

    // Delete image references (images are stored on Cloudinary, we could optionally call cloudinary.uploader.destroy but typically deleting DB ref is sufficient)
    await journal.deleteOne();

    return res.json({
      success: true,
      message: 'Đã xóa nhật ký thành công.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getJournalsByTrip,
  getJournalById,
  createJournal,
  updateJournal,
  deleteJournal,
};
