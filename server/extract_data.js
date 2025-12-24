const mongoose = require('mongoose');
const { connectDB, User, Team, Client, Project, Job, Task, TimeLog, LeaveBalance, LeaveRequest, ModuleConfig, Announcement, Holiday, Attendance } = require('./models');
const fs = require('fs');
const path = require('path');

const models = {
  users: User,
  teams: Team,
  clients: Client,
  projects: Project,
  jobs: Job,
  tasks: Task,
  timelogs: TimeLog,
  leave_balances: LeaveBalance,
  leave_requests: LeaveRequest,
  module_configs: ModuleConfig,
  announcements: Announcement,
  holidays: Holiday,
  attendance: Attendance
};

(async () => {
  try {
    await connectDB();
    console.log("Connected to DB, starting export...");

    const seedDir = path.join(__dirname, 'seed_data');
    if (!fs.existsSync(seedDir)) {
      fs.mkdirSync(seedDir);
    }

    for (const [key, model] of Object.entries(models)) {
      const data = await model.find({}).lean(); // Use lean() for plain objects
      const filePath = path.join(seedDir, `${key}_seed.json`);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      console.log(`exported ${data.length} records to ${key}_seed.json`);
    }

    console.log("Export complete.");
    process.exit(0);
  } catch (err) {
    console.error("Export failed:", err);
    process.exit(1);
  }
})();
