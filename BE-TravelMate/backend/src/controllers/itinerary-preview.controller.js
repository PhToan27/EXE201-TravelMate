const { generateItineraryPreview } = require('../services/itinerary-preview.service');

const parseInterests = (interests) => {
  const values = Array.isArray(interests) ? interests : String(interests || '').split(',');
  return [...new Set(values.map((value) => String(value).trim()).filter(Boolean))].slice(0, 8);
};

const isDateOnly = (value) => {
  const text = String(value || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;
  const date = new Date(`${text}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === text;
};

const getPreview = async (req, res) => {
  try {
    const destination = String(req.body.destination || '').trim();
    const startDate = String(req.body.startDate || '');
    const endDate = String(req.body.endDate || '');
    const people = Number(req.body.people);
    const budget = Number(req.body.budget || 0);
    const interests = parseInterests(req.body.interests);

    if (!destination) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập điểm đến.' });
    }
    if (destination.length > 100) {
      return res.status(400).json({ success: false, message: 'Điểm đến quá dài. Vui lòng nhập tối đa 100 ký tự.' });
    }
    if (!isDateOnly(startDate) || !isDateOnly(endDate)) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn ngày đi và ngày về hợp lệ.' });
    }

    const durationDays = Math.floor(
      (new Date(`${endDate}T00:00:00.000Z`) - new Date(`${startDate}T00:00:00.000Z`)) / 86400000
    ) + 1;
    if (durationDays < 1 || durationDays > 14) {
      return res.status(400).json({
        success: false,
        message: 'Thời gian gợi ý cần từ 1 đến 14 ngày và ngày về không được trước ngày đi.',
      });
    }
    if (!Number.isInteger(people) || people < 1 || people > 50) {
      return res.status(400).json({ success: false, message: 'Số người cần là một số nguyên từ 1 đến 50.' });
    }
    if (!Number.isFinite(budget) || budget < 0 || budget > 1000000000) {
      return res.status(400).json({ success: false, message: 'Ngân sách chưa hợp lệ.' });
    }

    const preview = await generateItineraryPreview({
      destination,
      startDate,
      endDate,
      people,
      budget,
      interests,
    });

    return res.json({
      success: true,
      message: 'Đã tạo lịch trình gợi ý để bạn xem trước.',
      data: preview,
    });
  } catch (error) {
    const isEmptyResult = ['NO_MATCHING_PLACES', 'INSUFFICIENT_PLACES'].includes(error.code);
    const status = isEmptyResult ? 404 : 500;
    return res.status(status).json({
      success: false,
      message:
        isEmptyResult
          ? error.message
          : 'Chưa thể tạo gợi ý lúc này. Vui lòng thử lại sau.',
    });
  }
};

module.exports = { getPreview };
