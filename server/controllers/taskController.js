
const db = require('../models');
const aiService = require('../services/aiService');

exports.getTasks = async (req, res) => {
  try {
    const tasks = await db.Task.find()
      .populate({
        path: 'jobId',
        populate: {
          path: 'projectId',
          populate: { path: 'clientId' }
        }
      });

    const formattedTasks = tasks.map(t => ({
      id: t._id,
      name: t.name,
      allocatedHours: t.allocatedHours,
      status: t.status,
      assignedBy: t.assignedBy,
      job: t.jobId ? {
        id: t.jobId._id,
        name: t.jobId.name,
        project: t.jobId.projectId ? {
          id: t.jobId.projectId._id,
          name: t.jobId.projectId.name,
          client: t.jobId.projectId.clientId ? { 
            id: t.jobId.projectId.clientId._id, 
            name: t.jobId.projectId.clientId.name 
          } : null
        } : null
      } : null
    }));

    res.status(200).json(formattedTasks);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch tasks.", details: err.message });
  }
};

exports.getTaskById = async (req, res) => {
  const { id } = req.params;
  try {
    const task = await db.Task.findById(id).populate({
      path: 'jobId',
      populate: { path: 'projectId', populate: { path: 'clientId' } }
    });
    
    if (!task) return res.status(404).json({ error: `Task not found.` });
    
    res.status(200).json(task);
  } catch (err) {
    res.status(500).json({ error: "Database error.", details: err.message });
  }
};

exports.updateTaskStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  try {
    const task = await db.Task.findById(id);
    if (!task) return res.status(404).json({ error: "Task not found." });

    task.status = status;
    await task.save();

    const updated = await db.Task.findById(id).populate({
      path: 'jobId',
      populate: { path: 'projectId', populate: { path: 'clientId' } }
    });

    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update.", details: err.message });
  }
};

exports.suggestPlan = async (req, res) => {
  const { tasks } = req.body;
  try {
      const suggestion = await aiService.suggestTaskPlan(tasks);
      res.status(200).json(suggestion);
  } catch (error) {
      res.status(503).json({ error: "AI Service Unavailable" });
  }
};
