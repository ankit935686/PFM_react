const mongoose = require('mongoose');
const Income = require('../models/incomeModel');

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

const createIncome = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);

    if (!userId) {
      return res.status(401).json({
        message: 'Unauthorized: userId missing from auth middleware.',
      });
    }

    const { amount, source, date, notes } = req.body;

    if (amount === undefined || !source || !date) {
      return res.status(400).json({
        message: 'amount, source, and date are required.',
      });
    }

    const parsedDate = parseDate(date);
    if (!parsedDate) {
      return res.status(400).json({
        message: 'Invalid date format.',
      });
    }

    const income = await Income.create({
      userId,
      amount: Number(amount),
      source,
      date: parsedDate,
      notes: notes || '',
    });

    return res.status(201).json({
      message: 'Income created successfully',
      income,
    });
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({
        message: 'Validation failed while creating income.',
        error: error.message,
      });
    }

    return res.status(500).json({
      message: 'Failed to create income',
      error: error.message,
    });
  }
};

const getIncome = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);

    if (!userId) {
      return res.status(401).json({
        message: 'Unauthorized: userId missing from auth middleware.',
      });
    }

    const { source, startDate, endDate } = req.query;
    const searchKeyword = req.query.keyword || req.query.search || req.query.q;

    const query = { userId };

    if (source && String(source).toLowerCase() !== 'all') {
      query.source = source;
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

    const income = await Income.find(query).sort({ date: -1, createdAt: -1 }).lean();

    return res.status(200).json({
      count: income.length,
      income,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to fetch income',
      error: error.message,
    });
  }
};

const updateIncome = async (req, res) => {
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
        message: 'Invalid income id.',
      });
    }

    const allowedFields = ['amount', 'source', 'date', 'notes'];
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

    const income = await Income.findOneAndUpdate(
      { _id: id, userId },
      { $set: updates },
      { returnDocument: 'after', runValidators: true }
    ).lean();

    if (!income) {
      return res.status(404).json({
        message: 'Income not found',
      });
    }

    return res.status(200).json({
      message: 'Income updated successfully',
      income,
    });
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({
        message: 'Validation failed while updating income.',
        error: error.message,
      });
    }

    return res.status(500).json({
      message: 'Failed to update income',
      error: error.message,
    });
  }
};

const deleteIncome = async (req, res) => {
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
        message: 'Invalid income id.',
      });
    }

    const deletedIncome = await Income.findOneAndDelete({ _id: id, userId }).lean();

    if (!deletedIncome) {
      return res.status(404).json({
        message: 'Income not found',
      });
    }

    return res.status(200).json({
      message: 'Income deleted successfully',
      income: deletedIncome,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to delete income',
      error: error.message,
    });
  }
};

module.exports = {
  createIncome,
  getIncome,
  updateIncome,
  deleteIncome,
};
