
const db = require('../models');
const mongoose = require('mongoose');

exports.getEmployeeDashboard = async (req, res) => {
  const { userId } = req.params;
  
  if (req.user._id !== userId && !['Admin', 'HR', 'Scrum Master'].includes(req.user.role)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    const startOfDay = new Date();
    startOfDay.setHours(0,0,0,0);
    const endOfDay = new Date();
    endOfDay.setHours(23,59,59,999);

    // Sum today's logs
    const logsToday = await db.TimeLog.aggregate([
      { $match: { userId: userId, date: { $gte: startOfDay, $lte: endOfDay } } },
      { $group: { _id: null, total: { $sum: "$loggedHours" } } }
    ]);
    const totalLoggedToday = logsToday.length > 0 ? logsToday[0].total : 0;

    // Get all tasks with deep population
    const allTasks = await db.Task.find()
      .populate({
        path: 'jobId',
        model: 'Job',
        populate: {
          path: 'projectId',
          model: 'Project',
          populate: { path: 'clientId', model: 'Client' }
        }
      });

    // Calculate logged hours per task (lifetime)
    const taskLogs = await db.TimeLog.aggregate([
      { $match: { userId: userId } },
      { $group: { _id: "$taskId", total: { $sum: "$loggedHours" } } }
    ]);
    const logMap = taskLogs.reduce((map, item) => {
      map[item._id] = item.total;
      return map;
    }, {});

    const dailyPlan = allTasks.map(task => {
      const job = task.jobId;
      const project = job ? job.projectId : null;
      
      return {
        id: task._id,
        name: task.name,
        allocatedHours: task.allocatedHours,
        status: task.status,
        assignedBy: task.assignedBy,
        job: job ? {
          id: job._id,
          name: job.name,
          project: project ? {
            id: project._id,
            name: project.name,
            client: project.clientId ? { id: project.clientId._id, name: project.clientId.name } : null
          } : null
        } : null,
        loggedHours: logMap[task._id] || 0
      };
    });
    
    const leave = await db.LeaveBalance.findById(userId);

    res.status(200).json({
      checkInStatus: {
        isCheckedIn: true,
        checkInTime: new Date().toISOString()
      },
      dailyPlan: dailyPlan,
      totalLoggedHoursToday: totalLoggedToday,
      requiredDailyHours: 8,
      leaveBalance: leave || { annual: 0, sick: 0, casual: 0 }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.getScrumMasterDashboard = async (req, res) => {
  const { teamId } = req.params;
  
  try {
    const team = await db.Team.findById(teamId);
    if (!team) return res.status(404).json({ error: "Team not found" });

    const teamMembers = await db.User.find({ teamId });
    
    const membersStatus = await Promise.all(teamMembers.map(async (m) => {
        const logs = await db.TimeLog.aggregate([
          { $match: { userId: m._id } },
          { $group: { _id: null, total: { $sum: "$loggedHours" } } }
        ]);
        const total = logs.length > 0 ? logs[0].total : 0;
        
        return {
            id: m._id,
            name: m.name,
            avatarUrl: m.avatarUrl,
            checkInTime: "2024-07-20T09:00:00Z", 
            totalLoggedHours: total,
            requiredHours: 8,
            progressPercentage: Math.min((total / 8) * 100, 100)
        };
    }));

    res.status(200).json({
      teamName: team.name,
      teamMembersStatus: membersStatus
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getReportsDashboard = async (req, res) => {
    res.status(200).json({
        projectHoursDistribution: [
          { name: "Project Phoenix", value: 400 },
          { name: "Orion Platform", value: 300 },
          { name: "RetailNext", value: 150 },
          { name: "Internal Training", value: 50 }
        ],
        reportTypes: [
          "Client-based Timesheet",
          "Project-based Timesheet",
          "Individual Timesheet"
        ]
      });
};

exports.getAdminDashboard = async (req, res) => {
    try {
      const modules = await db.ModuleConfig.find();
      const clientsCount = await db.Client.countDocuments();
      const projectsCount = await db.Project.countDocuments();
      const jobsCount = await db.Job.countDocuments();

      res.status(200).json({
        moduleConfigurations: modules.map(m => ({ name: m._id, enabled: m.enabled })),
        masterDataSummaries: {
          clientsCount,
          projectsCount,
          jobsCount
        }
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
};
