const cloudinary = require('cloudinary').v2;
const Expense = require('../models/Expense');
const Trip = require('../models/Trip');
const Activity = require('../models/Activity');
const HotelSuggestion = require('../models/HotelSuggestion');
const RestaurantSuggestion = require('../models/RestaurantSuggestion');
const BudgetBreakdown = require('../models/BudgetBreakdown');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const CATEGORY_LABELS = {
  FOOD: 'Ăn uống',
  STAY: 'Nơi ở',
  TRANSPORT: 'Di chuyển',
  VISIT: 'Tham quan',
  SHOPPING: 'Mua sắm',
  OTHER: 'Phát sinh',
};

const normalizeCategory = (value) => {
  const category = String(value || '').toUpperCase();
  return Object.prototype.hasOwnProperty.call(CATEGORY_LABELS, category) ? category : 'OTHER';
};

const parseAmount = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
};

const toMoney = (value) => {
  const amount = Number(value || 0);
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
};

const getTripDays = (trip) => {
  if (trip?.totalDays) return Math.max(Number(trip.totalDays) || 1, 1);

  if (trip?.startDate && trip?.endDate) {
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    return Math.max(days || 1, 1);
  }

  return 1;
};

const mapActivityCategory = (category) => {
  const key = String(category || '').toUpperCase();
  if (key === 'FOOD') return 'FOOD';
  if (key === 'HOTEL') return 'STAY';
  if (key === 'TRANSPORT') return 'TRANSPORT';
  if (key === 'SHOPPING') return 'SHOPPING';
  return 'VISIT';
};

const serializePlannedExpense = ({ id, sourceType, title, amount, category, note }) => ({
  _id: id,
  sourceType,
  title,
  amount,
  category,
  categoryLabel: CATEGORY_LABELS[category] || CATEGORY_LABELS.OTHER,
  note: note || '',
});

const buildPlannedExpenses = async (trip) => {
  const [activities, hotel, restaurants, budgetBreakdown] = await Promise.all([
    Activity.find({ tripId: trip._id }).sort({ createdAt: 1 }),
    HotelSuggestion.findOne({ tripId: trip._id }).sort({ createdAt: 1 }),
    RestaurantSuggestion.find({ tripId: trip._id }).sort({ createdAt: 1 }),
    BudgetBreakdown.findOne({ tripId: trip._id }),
  ]);

  const planned = [];
  const totalPeople = Math.max(Number(trip.totalPeople || 1), 1);
  const totalDays = getTripDays(trip);

  if (hotel) {
    const amount = toMoney(hotel.estimatedTotalPrice) || toMoney(hotel.pricePerNight) * totalDays;
    if (amount > 0) {
      planned.push(serializePlannedExpense({
        id: `planned-hotel-${hotel._id}`,
        sourceType: 'STAY',
        title: hotel.name || 'Nơi ở',
        amount,
        category: 'STAY',
        note: hotel.pricePerNight ? `${hotel.pricePerNight.toLocaleString('vi-VN')} đ/đêm` : '',
      }));
    }
  }

  activities.forEach((activity) => {
    const activityAmount = toMoney(activity.estimatedCost);
    if (activityAmount > 0) {
      planned.push(serializePlannedExpense({
        id: `planned-activity-${activity._id}`,
        sourceType: 'ACTIVITY',
        title: activity.locationName || activity.title || 'Hoạt động',
        amount: activityAmount,
        category: mapActivityCategory(activity.category),
        note: activity.time || '',
      }));
    }

    const transportAmount = toMoney(activity.transportCost);
    if (transportAmount > 0) {
      planned.push(serializePlannedExpense({
        id: `planned-transport-${activity._id}`,
        sourceType: 'TRANSPORT',
        title: `Di chuyển đến ${activity.locationName || activity.title || 'địa điểm'}`,
        amount: transportAmount,
        category: 'TRANSPORT',
        note: activity.transport || '',
      }));
    }
  });

  restaurants.forEach((restaurant) => {
    const amount = toMoney(restaurant.averagePricePerPerson) * totalPeople;
    if (amount > 0) {
      planned.push(serializePlannedExpense({
        id: `planned-restaurant-${restaurant._id}`,
        sourceType: 'FOOD',
        title: restaurant.name || 'Địa điểm ăn uống',
        amount,
        category: 'FOOD',
        note: `${totalPeople} người`,
      }));
    }
  });

  if (planned.length === 0 && budgetBreakdown) {
    [
      { key: 'STAY', title: 'Nơi ở dự kiến', amount: budgetBreakdown.accommodation?.amount },
      { key: 'FOOD', title: 'Ăn uống dự kiến', amount: budgetBreakdown.food?.amount },
      { key: 'TRANSPORT', title: 'Di chuyển dự kiến', amount: budgetBreakdown.transport?.amount },
      { key: 'VISIT', title: 'Tham quan dự kiến', amount: budgetBreakdown.activities?.amount },
      { key: 'SHOPPING', title: 'Mua sắm dự kiến', amount: budgetBreakdown.shopping?.amount },
      { key: 'OTHER', title: 'Phát sinh dự kiến', amount: budgetBreakdown.other?.amount },
    ].forEach((item) => {
      const amount = toMoney(item.amount);
      if (amount > 0) {
        planned.push(serializePlannedExpense({
          id: `planned-budget-${item.key}`,
          sourceType: 'BUDGET',
          title: item.title,
          amount,
          category: item.key,
          note: 'Theo phân bổ ngân sách',
        }));
      }
    });
  }

  return planned;
};

const uploadBillImage = (file) =>
  new Promise((resolve, reject) => {
    if (!file) {
      resolve('');
      return;
    }

    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      reject(new Error('Chưa cấu hình nơi lưu ảnh bill.'));
      return;
    }

    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'travelmate/expense-bills',
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

const findOwnedTrip = async (tripId, userId) => {
  if (!tripId) return null;
  return Trip.findOne({ _id: tripId, userId });
};

const findOwnedExpense = async (expenseId, userId) => {
  if (!expenseId) return null;
  return Expense.findOne({ _id: expenseId, userId });
};

const buildSummary = (trip, expenses, plannedExpenses = []) => {
  const byCategory = Object.keys(CATEGORY_LABELS).reduce((acc, key) => {
    acc[key] = {
      key,
      label: CATEGORY_LABELS[key],
      amount: 0,
      count: 0,
    };
    return acc;
  }, {});

  [...plannedExpenses, ...expenses].forEach((expense) => {
    const key = normalizeCategory(expense.category);
    byCategory[key].amount += Number(expense.amount || 0);
    byCategory[key].count += 1;
  });

  const totalSpent = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const plannedTotal = plannedExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const projectedTotal = totalSpent + plannedTotal;
  const totalBudget = Number(trip?.budget || 0);

  return {
    totalBudget,
    totalSpent,
    plannedTotal,
    projectedTotal,
    remainingBudget: totalBudget - projectedTotal,
    actualRemainingBudget: totalBudget - totalSpent,
    byCategory: Object.values(byCategory).filter((item) => item.amount > 0 || item.count > 0),
  };
};

const buildExpenseResponse = async (trip, expenses) => {
  const plannedExpenses = await buildPlannedExpenses(trip);
  return {
    data: expenses.map(serializeExpense),
    plannedExpenses,
    summary: buildSummary(trip, expenses, plannedExpenses),
  };
};

const serializeExpense = (expense) => ({
  _id: expense._id,
  tripId: expense.tripId,
  title: expense.title,
  amount: expense.amount,
  category: expense.category,
  categoryLabel: CATEGORY_LABELS[expense.category] || CATEGORY_LABELS.OTHER,
  paidAt: expense.paidAt,
  note: expense.note || '',
  billImageUrl: expense.billImageUrl || '',
  createdAt: expense.createdAt,
  updatedAt: expense.updatedAt,
});

const getTripExpenses = async (req, res) => {
  try {
    const trip = await findOwnedTrip(req.params.tripId, req.user._id);
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy chuyến đi.' });
    }

    const expenses = await Expense.find({ tripId: trip._id, userId: req.user._id }).sort({ paidAt: -1, createdAt: -1 });
    const payload = await buildExpenseResponse(trip, expenses);

    return res.json({
      success: true,
      ...payload,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createExpense = async (req, res) => {
  try {
    const trip = await findOwnedTrip(req.params.tripId, req.user._id);
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy chuyến đi.' });
    }

    const amount = parseAmount(req.body.amount);
    if (!req.body.title || amount === null) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập tên khoản chi và số tiền hợp lệ.' });
    }

    const billImageUrl = await uploadBillImage(req.file);
    const expense = await Expense.create({
      tripId: trip._id,
      userId: req.user._id,
      title: String(req.body.title).trim(),
      amount,
      category: normalizeCategory(req.body.category),
      paidAt: req.body.paidAt ? new Date(req.body.paidAt) : new Date(),
      note: req.body.note || '',
      billImageUrl,
    });

    const expenses = await Expense.find({ tripId: trip._id, userId: req.user._id });
    const payload = await buildExpenseResponse(trip, expenses);
    return res.status(201).json({
      success: true,
      data: serializeExpense(expense),
      plannedExpenses: payload.plannedExpenses,
      summary: payload.summary,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateExpense = async (req, res) => {
  try {
    const expense = await findOwnedExpense(req.params.id, req.user._id);
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy khoản chi.' });
    }

    const trip = await findOwnedTrip(expense.tripId, req.user._id);
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy chuyến đi.' });
    }

    if (req.body.title !== undefined) expense.title = String(req.body.title).trim();
    if (req.body.amount !== undefined) {
      const amount = parseAmount(req.body.amount);
      if (amount === null) {
        return res.status(400).json({ success: false, message: 'Số tiền không hợp lệ.' });
      }
      expense.amount = amount;
    }
    if (req.body.category !== undefined) expense.category = normalizeCategory(req.body.category);
    if (req.body.paidAt !== undefined) expense.paidAt = new Date(req.body.paidAt);
    if (req.body.note !== undefined) expense.note = req.body.note || '';
    if (req.file) expense.billImageUrl = await uploadBillImage(req.file);

    await expense.save();

    const expenses = await Expense.find({ tripId: trip._id, userId: req.user._id });
    const payload = await buildExpenseResponse(trip, expenses);
    return res.json({
      success: true,
      data: serializeExpense(expense),
      plannedExpenses: payload.plannedExpenses,
      summary: payload.summary,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteExpense = async (req, res) => {
  try {
    const expense = await findOwnedExpense(req.params.id, req.user._id);
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy khoản chi.' });
    }

    const trip = await findOwnedTrip(expense.tripId, req.user._id);
    await expense.deleteOne();

    const expenses = trip ? await Expense.find({ tripId: trip._id, userId: req.user._id }) : [];
    const payload = trip ? await buildExpenseResponse(trip, expenses) : null;
    return res.json({
      success: true,
      message: 'Đã xóa khoản chi.',
      plannedExpenses: payload?.plannedExpenses || [],
      summary: payload?.summary || null,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getTripExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
};
