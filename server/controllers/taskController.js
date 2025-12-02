
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
    res.status(500).json({ error: err.message });
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
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.status(200).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateTaskStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!['To Do', 'In Progress', 'Completed'].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
  }

  try {
    const task = await db.Task.findByPk(id);
    if (!task) return res.status(404).json({ error: "Task not found" });

    task.status = status;
    await task.save();

    // Reload with associations
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
    res.status(500).json({ error: err.message });
  }
};

exports.suggestPlan = async (req, res) => {
  const { tasks } = req.body;
  if (!tasks || !Array.isArray(tasks)) {
      return res.status(400).json({ error: "Invalid tasks array provided." });
  }

  try {
      const suggestion = await aiService.suggestTaskPlan(tasks);
      res.status(200).json(suggestion);
  } catch (error) {
      res.status(500).json({ error: `Failed to generate plan: ${error.message}` });
  }
};
