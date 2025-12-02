
const db = require('../models');
const { Op } = require('sequelize');

exports.getTimeLogs = async (req, res) => {
  const { userId, taskId, date } = req.query;
  const whereClause = {};

  if (userId) whereClause.userId = userId;
  if (taskId) whereClause.taskId = taskId;
  if (date) {
    // Simple substring match for date YYYY-MM-DD
    const start = new Date(date);
    const end = new Date(date);
    end.setHours(23, 59, 59);
    whereClause.date = { [Op.between]: [start, end] };
  }

  try {
    const logs = await db.TimeLog.findAll({ where: whereClause });
    res.status(200).json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createTimeLog = async (req, res) => {
  const { taskId, loggedHours, notes, date } = req.body;
  
  if (!taskId || !loggedHours) {
      return res.status(400).json({ error: "taskId and loggedHours are required" });
  }

  try {
    const task = await db.Task.findByPk(taskId);
    if (!task) return res.status(404).json({ error: "Task not found" });

    const newLog = await db.TimeLog.create({
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        taskId,
        loggedHours,
        notes,
        date: date || new Date(),
        userId: req.user.id
    });

    res.status(201).json(newLog);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};