
const db = require('../models');
const aiService = require('../services/aiService');

exports.getTasks = async (req, res) => {
  try {
    const tasks = await db.Task.findAll({
      include: [{
        model: db.Job,
        include: [{
          model: db.Project,
          include: [db.Client]
        }]
      }]
    });
    res.status(200).json(tasks);
  } catch (err) {
    console.error("Get Tasks Error:", err);
    res.status(500).json({ error: "Failed to fetch tasks.", details: err.message });
  }
};

exports.getTaskById = async (req, res) => {
  const { id } = req.params;
  try {
    const task = await db.Task.findByPk(id, {
      include: [{
        model: db.Job,
        include: [{
          model: db.Project,
          include: [db.Client]
        }]
      }]
    });
    if (!task) return res.status(404).json({ error: `Task with ID ${id} not found.` });
    res.status(200).json(task);
  } catch (err) {
    console.error("Get Task By ID Error:", err);
    res.status(500).json({ error: "Database error while fetching task.", details: err.message });
  }
};

exports.updateTaskStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  const validStatuses = ['To Do', 'In Progress', 'Completed'];
  if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: "Invalid status provided.", 
        allowedValues: validStatuses 
      });
  }

  try {
    const task = await db.Task.findByPk(id);
    if (!task) return res.status(404).json({ error: "Task not found." });

    task.status = status;
    await task.save();

    // Reload with associations for the response
    const updatedTask = await db.Task.findByPk(id, {
      include: [{
        model: db.Job,
        include: [{
          model: db.Project,
          include: [db.Client]
        }]
      }]
    });

    res.status(200).json(updatedTask);
  } catch (err) {
    console.error("Update Task Status Error:", err);
    if (err.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: "Validation Error", details: err.errors.map(e => e.message) });
    }
    res.status(500).json({ error: "Failed to update task status.", details: err.message });
  }
};

exports.suggestPlan = async (req, res) => {
  const { tasks } = req.body;
  
  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({ error: "Invalid or empty tasks array provided." });
  }

  try {
      const suggestion = await aiService.suggestTaskPlan(tasks);
      res.status(200).json(suggestion);
  } catch (error) {
      console.error("AI Plan Suggestion Error:", error);
      res.status(503).json({ 
        error: "AI Service Unavailable", 
        details: "Failed to generate plan. Please try again later or plan manually." 
      });
  }
};
