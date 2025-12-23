
const db = require('../models');

exports.getTimesheetReport = async (req, res) => {
    const { reportType, startDate, endDate, userId } = req.query;
    
    if (reportType === 'Individual Timesheet' && userId) {
        try {
          const user = await db.User.findById(userId);
          const logs = await db.TimeLog.find({
              userId: userId,
              date: { $gte: new Date(startDate), $lte: new Date(endDate) }
          }).populate({
              path: 'taskId',
              populate: { path: 'jobId', populate: { path: 'projectId', populate: { path: 'clientId' } } }
          });

          // Grouping logic
          const grouped = logs.reduce((acc, log) => {
              const dateKey = log.date.toISOString().split('T')[0];
              if (!acc[dateKey]) acc[dateKey] = [];
              acc[dateKey].push(log);
              return acc;
          }, {});

          const data = Object.keys(grouped).map(date => {
              const dayLogs = grouped[date];
              return {
                  date,
                  tasks: dayLogs.map(l => ({
                      taskName: l.taskId?.name,
                      projectName: l.taskId?.jobId?.projectId?.name,
                      clientName: l.taskId?.jobId?.projectId?.clientId?.name,
                      loggedHours: l.loggedHours,
                      notes: l.notes
                  })),
                  totalHoursDay: dayLogs.reduce((sum, l) => sum + l.loggedHours, 0)
              };
          });

          res.json({
              reportTitle: `Individual Timesheet Report for ${user?.name}`,
              period: `${startDate} to ${endDate}`,
              generatedBy: req.user.name,
              data,
              grandTotalHours: logs.reduce((sum, l) => sum + l.loggedHours, 0)
          });
        } catch(err) {
          res.status(500).json({error: err.message});
        }
    } else {
        res.status(501).json({ message: "Not supported" });
    }
};

exports.getLeaveBalance = async (req, res) => {
    const { userId } = req.params;
    try {
      const balance = await db.LeaveBalance.findById(userId);
      res.json({
          userId,
          annualLeave: balance?.annual || 0,
          sickLeave: balance?.sick || 0,
          casualLeave: balance?.casual || 0
      });
    } catch(err) { res.status(500).json({error: err.message}); }
};
