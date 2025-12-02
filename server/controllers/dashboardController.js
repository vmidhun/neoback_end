
const db = require('../models');
const { Op } = require('sequelize');

exports.getEmployeeDashboard = async (req, res) => {
  const { userId } = req.params;
  
  // Authorization check
  if (req.user.id !== userId && !['Admin', 'HR', 'Scrum Master'].includes(req.user.role)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    // Get logs for today
    const startOfDay = new Date();
    startOfDay.setHours(0,0,0,0);
    const endOfDay = new Date();
    endOfDay.setHours(23,59,59,999);

    const userLogsToday = await db.TimeLog.findAll({
      where: {
        userId: userId,
        date: { [Op.between]: [startOfDay, endOfDay] }
      }
    });
    
    const totalLogged = userLogsToday.reduce((sum, log) => sum + log.loggedHours, 0);

    // Get all tasks to calculate potential work
    const allTasks = await db.Task.findAll({
      include: [{
        model: db.Job,
        include: [{
          model: db.Project,
          include: [db.Client]
        }]
      }]
    });

    // Hydrate plan with logs
    const dailyPlan = await Promise.all(allTasks.map(async (task) => {
      const logs = await db.TimeLog.sum('loggedHours', {
        where: { taskId: task.id, userId: userId }
      });
      
      return {
        id: task.id,
        name: task.name,
        allocatedHours: task.allocatedHours,
        status: task.status,
        assignedBy: task.assignedBy,
        job: task.job,
        loggedHours: logs || 0
      };
    }));
    
    const leave = await db.LeaveBalance.findByPk(userId);

    res.status(200).json({
      checkInStatus: {
        isCheckedIn: true,
        checkInTime: new Date().toISOString()
      },
      dailyPlan: dailyPlan,
      totalLoggedHoursToday: totalLogged,
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
    const team = await db.Team.findByPk(teamId);
    if (!team) return res.status(404).json({ error: "Team not found" });

    const teamMembers = await db.User.findAll({ where: { teamId } });
    
    const membersStatus = await Promise.all(teamMembers.map(async (m) => {
        const total = await db.TimeLog.sum('loggedHours', { where: { userId: m.id } }) || 0;
        return {
            id: m.id,
            name: m.name,
            avatarUrl: m.avatarUrl,
            checkInTime: "2024-07-20T09:00:00Z", // Mock
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
    // Mock aggregations
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
      const modules = await db.ModuleConfig.findAll();
      const clientsCount = await db.Client.count();
      const projectsCount = await db.Project.count();
      const jobsCount = await db.Job.count();

      res.status(200).json({
        moduleConfigurations: modules,
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