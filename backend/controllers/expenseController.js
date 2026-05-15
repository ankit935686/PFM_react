const mongoose = require('mongoose');
const Expense = require('../models/expenseModel');

const getUserIdFromRequest = (req) => {
  return req.userId || req.user?.userId || req.user?._id || req.user?.id || null;
};

const parseDate = (value, isEndOfDay = false) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  if (isEndOfDay && /^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    parsed.setHours(23, 59, 59, 999);
  }

  return parsed;
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const createExpense = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);

    if (!userId) {
      return res.status(401).json({
        message: 'Unauthorized: userId missing from auth middleware.',
      });
    }

    const { amount, category, date, paymentMethod, notes } = req.body;

    if (amount === undefined || !category || !date || !paymentMethod) {
      return res.status(400).json({
        message: 'amount, category, date, and paymentMethod are required.',
      });
    }

    const parsedDate = parseDate(date);
    if (!parsedDate) {
      return res.status(400).json({
        message: 'Invalid date format.',
      });
    }

    const expense = await Expense.create({
      userId,
      amount: Number(amount),
      category,
      date: parsedDate,
      paymentMethod,
      notes: notes || '',
    });

    return res.status(201).json({
      message: 'Expense created successfully',
      expense,
    });
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({
        message: 'Validation failed while creating expense.',
        error: error.message,
      });
    }

    return res.status(500).json({
      message: 'Failed to create expense',
      error: error.message,
    });
  }
};

const getExpenses = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);

    if (!userId) {
      return res.status(401).json({
        message: 'Unauthorized: userId missing from auth middleware.',
      });
    }

    const { category, startDate, endDate } = req.query;
    const searchKeyword = req.query.keyword || req.query.search || req.query.q;

    const query = { userId };

    if (category && String(category).toLowerCase() !== 'all') {
      query.category = category;
    }

    const parsedStartDate = parseDate(startDate);
    const parsedEndDate = parseDate(endDate, true);

    if (startDate && !parsedStartDate) {
      return res.status(400).json({
        message: 'Invalid startDate format.',
      });
    }

    if (endDate && !parsedEndDate) {
      return res.status(400).json({
        message: 'Invalid endDate format.',
      });
    }

    if (parsedStartDate || parsedEndDate) {
      query.date = {};

      if (parsedStartDate) {
        query.date.$gte = parsedStartDate;
      }

      if (parsedEndDate) {
        query.date.$lte = parsedEndDate;
      }
    }

    if (searchKeyword && String(searchKeyword).trim()) {
      query.notes = {
        $regex: escapeRegex(String(searchKeyword).trim()),
        $options: 'i',
      };
    }

    const expenses = await Expense.find(query).sort({ date: -1, createdAt: -1 }).lean();

    return res.status(200).json({
      count: expenses.length,
      expenses,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to fetch expenses',
      error: error.message,
    });
  }
};

const updateExpense = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);

    if (!userId) {
      return res.status(401).json({
        message: 'Unauthorized: userId missing from auth middleware.',
      });
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Invalid expense id.',
      });
    }

    const allowedFields = ['amount', 'category', 'date', 'paymentMethod', 'notes'];
    const updates = {};

    allowedFields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: 'At least one updatable field is required.',
      });
    }

    if (updates.date) {
      const parsedDate = parseDate(updates.date);

      if (!parsedDate) {
        return res.status(400).json({
          message: 'Invalid date format.',
        });
      }

      updates.date = parsedDate;
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'amount')) {
      updates.amount = Number(updates.amount);
    }

    const expense = await Expense.findOneAndUpdate(
      { _id: id, userId },
      { $set: updates },
      { returnDocument: 'after', runValidators: true }
    ).lean();

    if (!expense) {
      return res.status(404).json({
        message: 'Expense not found',
      });
    }

    return res.status(200).json({
      message: 'Expense updated successfully',
      expense,
    });
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({
        message: 'Validation failed while updating expense.',
        error: error.message,
      });
    }

    return res.status(500).json({
      message: 'Failed to update expense',
      error: error.message,
    });
  }
};

const deleteExpense = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);

    if (!userId) {
      return res.status(401).json({
        message: 'Unauthorized: userId missing from auth middleware.',
      });
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Invalid expense id.',
      });
    }

    const deletedExpense = await Expense.findOneAndDelete({ _id: id, userId }).lean();

    if (!deletedExpense) {
      return res.status(404).json({
        message: 'Expense not found',
      });
    }

    return res.status(200).json({
      message: 'Expense deleted successfully',
      expense: deletedExpense,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to delete expense',
      error: error.message,
    });
  }
};

module.exports = {
  createExpense,
  getExpenses,
  updateExpense,
  deleteExpense,
};
