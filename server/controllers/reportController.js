
const db = require('../models');
const { Op } = require('sequelize');

exports.getTimesheetReport = async (req, res) => {
    const { reportType, startDate, endDate, userId } = req.query;
    
    // Simplified logic for "Individual Timesheet"
    if (reportType === 'Individual Timesheet' && userId) {
        try {
          const user = await db.User.findByPk(userId);
          const logs = await db.TimeLog.findAll({
            where: {
              userId: userId,
              date: { [Op.between]: [new Date(startDate), new Date(endDate)] }
            },
            include: [{
              model: db.Task,
              include: [{
                model: db.Job,
                include: [{
                  model: db.Project,
                  include: [db.Client]
                }]
              }]
            }]
          });

          // Group by Date
          const grouped = logs.reduce((acc, log) => {
              const date = new Date(log.date).toISOString().split('T')[0];
              if (!acc[date]) acc[date] = [];
              acc[date].push(log);
              return acc;
          }, {});

          const data = Object.keys(grouped).map(date => {
              const dayLogs = grouped[date];
              return {
                  date,
                  tasks: dayLogs.map(l => {
                      return {
                          taskName: l.task?.name,
                          projectName: l.task?.job?.project?.name,
                          clientName: l.task?.job?.project?.client?.name,
                          loggedHours: l.loggedHours,
                          notes: l.notes
                      };
                  }),
                  totalHoursDay: dayLogs.reduce((sum, l) => sum + l.loggedHours, 0)
              };
          });

          const totalHours = logs.reduce((sum, l) => sum + l.loggedHours, 0);

          res.json({
              reportTitle: `Individual Timesheet Report for ${user?.name}`,
              period: `${startDate} to ${endDate}`,
              generatedBy: req.user.name,
              data,
              grandTotalHours: totalHours
          });
        } catch(err) {
          res.status(500).json({error: err.message});
        }
    } else {
        res.status(501).json({ message: "Only Individual Timesheet supported in nut shell API" });
    }
};

exports.getLeaveBalance = async (req, res) => {
    const { userId } = req.params;
    try {
      const user = await db.User.findByPk(userId);
      if (!user) return res.status(404).json({error: "User not found"});

      const balance = await db.LeaveBalance.findByPk(userId);
      res.json({
          userId: user.id,
          userName: user.name,
          annualLeave: balance?.annual || 0,
          sickLeave: balance?.sick || 0,
          casualLeave: balance?.casual || 0
      });
    } catch(err) {
      res.status(500).json({error: err.message});
    }
};