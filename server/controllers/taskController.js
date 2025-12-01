
const store = require('../data/store');
const aiService = require('../services/aiService');

// Helper to hydrate task
const hydrateTask = (task) => {
  const job = store.jobs.find(j => j.id === task.jobId);
  const project = job ? store.projects.find(p => p.id === job.projectId) : null;
  const client = project ? store.clients.find(c => c.id === project.clientId) : null;

  return {
    ...task,
    job: job ? {
      id: job.id,
      name: job.name,
      project: project ? {
        id: project.id,
        name: project.name,
        client: client
      } : null
    } : null
  };
};

exports.getTasks = (req, res) => {
  // Filters could be applied here based on req.query
  const hydratedTasks = store.tasks.map(hydrateTask);
  res.status(200).json(hydratedTasks);
};

exports.getTaskById = (req, res) => {
  const { id } = req.params;
  const task = store.tasks.find(t => t.id === id);
  if (!task) return res.status(404).json({ error: "Task not found" });
  res.status(200).json(hydrateTask(task));
};

exports.updateTaskStatus = (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  const task = store.tasks.find(t => t.id === id);
  if (!task) return res.status(404).json({ error: "Task not found" });

  if (!['To Do', 'In Progress', 'Completed'].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
  }

  task.status = status;
  res.status(200).json(hydrateTask(task));
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
