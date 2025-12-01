
const store = require('../data/store');

// Helper to hydrate task with job/project/client details
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

exports.getEmployeeDashboard = (req, res) => {
  const { userId } = req.params;
  
  // Authorization check: User can only see their own dashboard unless Admin/HR
  if (req.user.id !== userId && !['Admin', 'HR', 'Scrum Master'].includes(req.user.role)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  // Mock Logic for dashboard data
  const userLogsToday = store.timeLogs.filter(l => 
    l.userId === userId && l.date.startsWith(new Date().toISOString().split('T')[0])
  );
  
  const totalLogged = userLogsToday.reduce((sum, log) => sum + log.loggedHours, 0);

  // Get tasks assigned to this user (simulated by checking if they have logged time or if we add an 'assignedTo' field later)
  // For now, returning all tasks as potential "Daily Plan" items for the simulation
  const userTasks = store.tasks.map(hydrateTask);
  
  const leave = store.leaves[userId] || { annual: 0, sick: 0, casual: 0 };

  res.status(200).json({
    checkInStatus: {
      isCheckedIn: true,
      checkInTime: new Date().toISOString() // Mock
    },
    dailyPlan: userTasks.map(t => ({
        ...t,
        loggedHours: store.timeLogs
            .filter(l => l.taskId === t.id && l.userId === userId)
            .reduce((acc, curr) => acc + curr.loggedHours, 0)
    })),
    totalLoggedHoursToday: totalLogged,
    requiredDailyHours: 8,
    leaveBalance: leave
  });
};

exports.getScrumMasterDashboard = (req, res) => {
  const { teamId } = req.params;
  const team = store.teams.find(t => t.id === teamId);
  
  if (!team) return res.status(404).json({ error: "Team not found" });

  const teamMembers = store.users.filter(u => u.teamId === teamId);
  
  const membersStatus = teamMembers.map(m => {
      const logs = store.timeLogs.filter(l => l.userId === m.id);
      const total = logs.reduce((acc, l) => acc + l.loggedHours, 0);
      return {
          id: m.id,
          name: m.name,
          avatarUrl: m.avatarUrl,
          checkInTime: "2024-07-20T09:00:00Z", // Mock
          totalLoggedHours: total,
          requiredHours: 8,
          progressPercentage: (total / 8) * 100
      };
  });

  res.status(200).json({
    teamName: team.name,
    teamMembersStatus: membersStatus
  });
};

exports.getReportsDashboard = (req, res) => {
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

exports.getAdminDashboard = (req, res) => {
    res.status(200).json({
        moduleConfigurations: store.modules,
        masterDataSummaries: {
          clientsCount: store.clients.length,
          projectsCount: store.projects.length,
          jobsCount: store.jobs.length
        }
      });
};
