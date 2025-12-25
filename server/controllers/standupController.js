
const { StandupSession, Task, User, Team } = require('../models');

exports.getDailyStandup = async (req, res) => {
    try {
        const { date, teamId } = req.query;
        if (!date || !teamId) return res.status(400).json({ message: "Date and Team ID required" });

        // 1. Find existing session
        let session = await StandupSession.findOne({ date: new Date(date), teamId }).populate('tasks.taskId').populate('tasks.employeeId');
        
        // 2. If no session, maybe just return tasks due/active on this date?
        // Or return empty structure
        if (!session) {
             // Optional: Auto-create session or just return derived data
             // Let's return derived data from Tasks
             // Find tasks for this team on this date (dueDate or updated recently)
             // For now, return empty
             return res.json({ id: null, date, teamId, tasks: [] });
        }

        res.json(session);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error fetching standup" });
    }
};

exports.createOrUpdateSession = async (req, res) => {
    try {
        const { date, teamId, tasks } = req.body; // tasks: [{ taskId, status, notes }]
        
        let session = await StandupSession.findOne({ date: new Date(date), teamId });
        
        if (session) {
            session.tasks = tasks; // Replace or merge? Replace for simplicity
            await session.save();
        } else {
            session = new StandupSession({
                id: `su_${Date.now()}`,
                date: new Date(date),
                teamId,
                createdBy: req.user.id,
                tasks
            });
            await session.save();
        }
        res.json(session);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error saving standup" });
    }
};
