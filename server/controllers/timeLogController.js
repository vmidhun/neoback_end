
const db = require('../models');

exports.getTimeLogs = async (req, res) => {
  const { userId, taskId, date } = req.query;
  const query = {};

  if (userId) query.userId = userId;
  if (taskId) query.taskId = taskId;
  
  if (date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    query.date = { $gte: start, $lte: end };
  }

  try {
    const logs = await db.TimeLog.find(query);
    res.status(200).json(logs);
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve logs.", details: err.message });
  }
};

exports.createTimeLog = async (req, res) => {
  const { taskId, loggedHours, notes, date } = req.body;
  
  try {
    const task = await db.Task.findById(taskId);
    if (!task) return res.status(404).json({ error: "Task not found." });

    const newLog = await db.TimeLog.create({
        _id: `log_${Date.now()}`,
        taskId,
        loggedHours: parseFloat(loggedHours),
        notes,
        date: date ? new Date(date) : new Date(),
        userId: req.user._id
    });

    res.status(201).json(newLog);
  } catch (err) {
    res.status(500).json({ error: "Failed to create log.", details: err.message });
  }
};
