
const store = require('../data/store');

exports.getTimeLogs = (req, res) => {
  const { userId, taskId, date } = req.query;
  let logs = store.timeLogs;

  if (userId) logs = logs.filter(l => l.userId === userId);
  if (taskId) logs = logs.filter(l => l.taskId === taskId);
  if (date) logs = logs.filter(l => l.date.startsWith(date));

  res.status(200).json(logs);
};

exports.createTimeLog = (req, res) => {
  const { taskId, loggedHours, notes, date } = req.body;
  
  if (!taskId || !loggedHours) {
      return res.status(400).json({ error: "taskId and loggedHours are required" });
  }

  const task = store.tasks.find(t => t.id === taskId);
  if (!task) return res.status(404).json({ error: "Task not found" });

  const newLog = {
      id: `log_${Math.random().toString(36).substr(2, 9)}`,
      taskId,
      loggedHours,
      notes,
      date: date || new Date().toISOString(),
      userId: req.user.id
  };

  store.timeLogs.push(newLog);
  res.status(201).json(newLog);
};
