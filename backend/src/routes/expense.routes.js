const express = require('express');
const multer = require('multer');
const {
  getTripExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} = require('../controllers/expense.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

router.use(protect);

router
  .route('/trips/:tripId/expenses')
  .get(getTripExpenses)
  .post(upload.single('bill'), createExpense);

router
  .route('/expenses/:id')
  .put(upload.single('bill'), updateExpense)
  .delete(deleteExpense);

module.exports = router;
