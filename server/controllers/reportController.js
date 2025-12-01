
const store = require('../data/store');

exports.getTimesheetReport = (req, res) => {
    const { reportType, startDate, endDate, userId } = req.query;
    
    // Simplified logic for "Individual Timesheet" type as requested in spec example
    if (reportType === 'Individual Timesheet' && userId) {
        const user = store.users.find(u => u.id === userId);
        const logs = store.timeLogs.filter(l => 
            l.userId === userId && 
            l.date >= startDate && 
            l.date <= endDate
        );

        // Group by Date
        const grouped = logs.reduce((acc, log) => {
            const date = log.date.split('T')[0];
            if (!acc[date]) acc[date] = [];
            acc[date].push(log);
            return acc;
        }, {});

        const data = Object.keys(grouped).map(date => {
            const dayLogs = grouped[date];
            return {
                date,
                tasks: dayLogs.map(l => {
                    const task = store.tasks.find(t => t.id === l.taskId);
                    const job = task ? store.jobs.find(j => j.id === task.jobId) : null;
                    const project = job ? store.projects.find(p => p.id === job.projectId) : null;
                    const client = project ? store.clients.find(c => c.id === project.clientId) : null;
                    return {
                        taskName: task?.name,
                        projectName: project?.name,
                        clientName: client?.name,
                        loggedHours: l.loggedHours,
                        notes: l.notes
                    };
                }),
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
    } else {
        res.status(501).json({ message: "Only Individual Timesheet supported in mock" });
    }
};

exports.getLeaveBalance = (req, res) => {
    const { userId } = req.params;
    const user = store.users.find(u => u.id === userId);
    if (!user) return res.status(404).json({error: "User not found"});

    const balance = store.leaves[userId] || {};
    res.json({
        userId: user.id,
        userName: user.name,
        annualLeave: balance.annual || 0,
        sickLeave: balance.sick || 0,
        casualLeave: balance.casual || 0
    });
};
