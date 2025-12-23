
const db = require('../models');
const { Op } = require('sequelize');

exports.getTimeLogs = async (req, res) => {
  const { userId, taskId, date } = req.query;
  const whereClause = {};

  if (userId) whereClause.userId = userId;
  if (taskId) whereClause.taskId = taskId;
  
  if (date) {
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD." });
    }
    
    // Create range for the whole day
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    whereClause.date = { [Op.between]: [start, end] };
  }

  try {
    const logs = await db.TimeLog.findAll({ where: whereClause });
    res.status(200).json(logs);
  } catch (err) {
    console.error("Get TimeLogs Error:", err);
    res.status(500).json({ error: "Failed to retrieve time logs.", details: err.message });
  }
};

exports.createTimeLog = async (req, res) => {
  const { taskId, loggedHours, notes, date } = req.body;
  
  // Basic validation
  if (!taskId) return res.status(400).json({ error: "Task ID is required." });
  if (loggedHours === undefined || loggedHours === null) return res.status(400).json({ error: "Logged Hours are required." });
  if (isNaN(parseFloat(loggedHours))) return res.status(400).json({ error: "Logged Hours must be a number." });

  try {
    // Optional: Check if task exists before trying to create (or rely on foreign key error)
    const task = await db.Task.findByPk(taskId);
    if (!task) return res.status(404).json({ error: `Task with ID ${taskId} not found.` });

    const newLog = await db.TimeLog.create({
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        taskId,
        loggedHours: parseFloat(loggedHours),
        notes,
        date: date ? new Date(date) : new Date(),
        userId: req.user.id
    });

    res.status(201).json(newLog);
  } catch (err) {
    console.error("Create TimeLog Error:", err);

    if (err.name === 'SequelizeValidationError') {
       return res.status(400).json({ error: "Validation Error", details: err.errors.map(e => e.message) });
    }

    if (err.name === 'SequelizeForeignKeyConstraintError') {
       return res.status(400).json({ error: "Foreign Key Error: Invalid Task ID or User ID." });
    }

    res.status(500).json({ error: "Failed to create time log.", details: err.message });
  }
};
