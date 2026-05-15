const mongoose = require('mongoose');
const Budget = require('../models/budgetModel');

const getUserIdFromRequest = (req) => {
  return req.userId || req.user?.userId || req.user?._id || req.user?.id || null;
};

const parseNumber = (value) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const createBudget = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);

    if (!userId) {
      return res.status(401).json({
        message: 'Unauthorized: userId missing from auth middleware.',
      });
    }

    const { category, amount, month, year, notes } = req.body;

    if (!category || !amount || month === undefined || year === undefined) {
      return res.status(400).json({
        message: 'category, amount, month, and year are required.',
      });
    }

    const parsedAmount = parseNumber(amount);
    const parsedMonth = parseNumber(month);
    const parsedYear = parseNumber(year);

    if (parsedAmount === null || parsedMonth === null || parsedYear === null) {
      return res.status(400).json({
        message: 'amount, month, and year must be valid numbers.',
      });
    }

    const budget = await Budget.create({
      userId,
      category,
      amount: parsedAmount,
      month: parsedMonth,
      year: parsedYear,
      notes: notes || '',
    });

    return res.status(201).json({
      message: 'Budget created successfully',
      budget,
    });
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({
        message: 'Validation failed while creating budget.',
        error: error.message,
      });
    }

    return res.status(500).json({
      message: 'Failed to create budget',
      error: error.message,
    });
  }
};

const getBudgets = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);

    if (!userId) {
      return res.status(401).json({
        message: 'Unauthorized: userId missing from auth middleware.',
      });
    }

    const query = { userId };
    const parsedMonth = parseNumber(req.query.month);
    const parsedYear = parseNumber(req.query.year);

    if (parsedMonth) {
      query.month = parsedMonth;
    }

    if (parsedYear) {
      query.year = parsedYear;
    }

    const budgets = await Budget.find(query).sort({ year: -1, month: -1, createdAt: -1 }).lean();

    return res.status(200).json({
      count: budgets.length,
      budgets,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to fetch budgets',
      error: error.message,
    });
  }
};

const updateBudget = async (req, res) => {
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
        message: 'Invalid budget id.',
      });
    }

    const allowedFields = ['category', 'amount', 'month', 'year', 'notes'];
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

    if (Object.prototype.hasOwnProperty.call(updates, 'amount')) {
      const parsedAmount = parseNumber(updates.amount);
      if (parsedAmount === null) {
        return res.status(400).json({
          message: 'amount must be a valid number.',
        });
      }
      updates.amount = parsedAmount;
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'month')) {
      const parsedMonth = parseNumber(updates.month);
      if (parsedMonth === null) {
        return res.status(400).json({
          message: 'month must be a valid number.',
        });
      }
      updates.month = parsedMonth;
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'year')) {
      const parsedYear = parseNumber(updates.year);
      if (parsedYear === null) {
        return res.status(400).json({
          message: 'year must be a valid number.',
        });
      }
      updates.year = parsedYear;
    }

    const budget = await Budget.findOneAndUpdate(
      { _id: id, userId },
      { $set: updates },
      { returnDocument: 'after', runValidators: true }
    ).lean();

    if (!budget) {
      return res.status(404).json({
        message: 'Budget not found',
      });
    }

    return res.status(200).json({
      message: 'Budget updated successfully',
      budget,
    });
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({
        message: 'Validation failed while updating budget.',
        error: error.message,
      });
    }

    return res.status(500).json({
      message: 'Failed to update budget',
      error: error.message,
    });
  }
};

const deleteBudget = async (req, res) => {
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
        message: 'Invalid budget id.',
      });
    }

    const deletedBudget = await Budget.findOneAndDelete({ _id: id, userId }).lean();

    if (!deletedBudget) {
      return res.status(404).json({
        message: 'Budget not found',
      });
    }

    return res.status(200).json({
      message: 'Budget deleted successfully',
      budget: deletedBudget,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to delete budget',
      error: error.message,
    });
  }
};

module.exports = {
  createBudget,
  getBudgets,
  updateBudget,
  deleteBudget,
};
