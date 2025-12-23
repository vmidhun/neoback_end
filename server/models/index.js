
const mongoose = require('mongoose');
const config = require('../config');

let cachedConnection = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (cachedConnection) {
    return cachedConnection;
  }

  try {
    const uri = config.MONGODB_URI;
    console.log(`Connecting to MongoDB Atlas...`);
    
    cachedConnection = mongoose.connect(uri, {
      dbName: config.DB.NAME,
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000,
    });
    
    await cachedConnection;
    console.log("Successfully connected to MongoDB Atlas");
    return mongoose.connection;
  } catch (err) {
    cachedConnection = null;
    console.error("MongoDB Connection Error:", err.message);
    throw err;
  }
};

// --- Schemas ---
const UserSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['Admin', 'HR', 'Employee', 'Scrum Master'], default: 'Employee' },
  avatarUrl: { type: String },
  teamId: { type: String, ref: 'Team' },
  designation: { type: String },
  hierarchyLevel: { type: Number, default: 3 }, // 1: Director, 2: Lead/Manager, 3: Senior/Mid/Exec
  reportingManagerId: { type: String, ref: 'User' }
}, { timestamps: true, collection: 'users' });

const TeamSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true }
}, { timestamps: true, collection: 'teams' });

const ClientSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true }
}, { timestamps: true, collection: 'clients' });

const ProjectSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  clientId: { type: String, ref: 'Client', required: true }
}, { timestamps: true, collection: 'projects' });

const JobSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  projectId: { type: String, ref: 'Project', required: true }
}, { timestamps: true, collection: 'jobs' });

const TaskSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  allocatedHours: { type: Number, default: 0 },
  status: { type: String, enum: ['To Do', 'In Progress', 'Completed'], default: 'To Do' },
  assignedBy: { type: String },
  jobId: { type: String, ref: 'Job', required: true }
}, { timestamps: true, collection: 'tasks' });

const TimeLogSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  taskId: { type: String, ref: 'Task', required: true },
  userId: { type: String, ref: 'User', required: true },
  loggedHours: { type: Number, required: true },
  notes: { type: String },
  date: { type: Date, default: Date.now }
}, { timestamps: true, collection: 'timelogs' });

const LeaveBalanceSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  annual: { type: Number, default: 0 },
  sick: { type: Number, default: 0 },
  casual: { type: Number, default: 0 }
}, { timestamps: true, collection: 'leave_balances' });

const ModuleConfigSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  enabled: { type: Boolean, default: true }
}, { timestamps: true, collection: 'module_configs' });

const AnnouncementSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  authorId: { type: String, ref: 'User' },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' }
}, { timestamps: true, collection: 'announcements' });

const HolidaySchema = new mongoose.Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  date: { type: Date, required: true },
  description: { type: String }
}, { timestamps: true, collection: 'holidays' });

const AttendanceSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  userId: { type: String, ref: 'User', required: true },
  checkIn: { type: Date, required: true },
  checkOut: { type: Date },
  status: { type: String, enum: ['On Time', 'Late', 'Half Day', 'Absent'], default: 'On Time' }
}, { timestamps: true, collection: 'attendance' });

// --- Register Models ---
const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Team = mongoose.models.Team || mongoose.model('Team', TeamSchema);
const Client = mongoose.models.Client || mongoose.model('Client', ClientSchema);
const Project = mongoose.models.Project || mongoose.model('Project', ProjectSchema);
const Job = mongoose.models.Job || mongoose.model('Job', JobSchema);
const Task = mongoose.models.Task || mongoose.model('Task', TaskSchema);
const TimeLog = mongoose.models.TimeLog || mongoose.model('TimeLog', TimeLogSchema);
const LeaveBalance = mongoose.models.LeaveBalance || mongoose.model('LeaveBalance', LeaveBalanceSchema);
const ModuleConfig = mongoose.models.ModuleConfig || mongoose.model('ModuleConfig', ModuleConfigSchema);
const Announcement = mongoose.models.Announcement || mongoose.model('Announcement', AnnouncementSchema);
const Holiday = mongoose.models.Holiday || mongoose.model('Holiday', HolidaySchema);
const Attendance = mongoose.models.Attendance || mongoose.model('Attendance', AttendanceSchema);

const db = {
  mongoose,
  connectDB,
  User,
  Team,
  Client,
  Project,
  Job,
  Task,
  TimeLog,
  LeaveBalance,
  ModuleConfig,
  Announcement,
  Holiday,
  Attendance
};

db.seed = async (force = false) => {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0 && !force) return;

    console.log("Seeding database...");
    
    // Clear collections if forced
    if (force) {
        await Promise.all(Object.values(mongoose.models).map(m => m.deleteMany({})));
    }

    // Teams
    await Team.findOneAndUpdate({ _id: "team_alpha" }, { name: "Alpha Squad" }, { upsert: true });

    // Users
    // Users
    let userData = [];
    try {
      const fs = require('fs');
      const path = require('path');
      const seedPath = path.join(__dirname, '../seed_data/users_seed.json');
      if (fs.existsSync(seedPath)) {
        console.log("Loading users from seed file:", seedPath);
        userData = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
      } else {
        console.log("Seed file not found, skipping user update.");
      }
    } catch (e) {
      console.error("Error reading seed file:", e);
    }

    if (userData.length === 0) {
      // Fallback or empty
      userData = [
        { _id: "sam", name: "Sam Thomas", email: "sam@neointeraction.com", password: "password", role: "Admin", teamId: "team_alpha" }
      ];
    }
    for (const u of userData) await User.findOneAndUpdate({ _id: u._id }, u, { upsert: true });

    // Leave Balances
    for (const u of userData) {
        await LeaveBalance.findOneAndUpdate({ _id: u._id }, { annual: 12, sick: 5, casual: 2 }, { upsert: true });
    }

    // Clients, Projects, Jobs
    await Client.findOneAndUpdate({ _id: "cli_1" }, { name: "Innovate Corp" }, { upsert: true });
    await Client.findOneAndUpdate({ _id: "cli_2" }, { name: "Quantum Solutions" }, { upsert: true });
    
    await Project.findOneAndUpdate({ _id: "proj_1" }, { name: "Project Phoenix", clientId: "cli_1" }, { upsert: true });
    await Project.findOneAndUpdate({ _id: "proj_2" }, { name: "Orion Platform", clientId: "cli_2" }, { upsert: true });

    await Job.findOneAndUpdate({ _id: "job_1" }, { name: "Backend Development", projectId: "proj_1" }, { upsert: true });
    await Job.findOneAndUpdate({ _id: "job_2" }, { name: "UI/UX Design", projectId: "proj_1" }, { upsert: true });
    await Job.findOneAndUpdate({ _id: "job_3" }, { name: "Database Optimization", projectId: "proj_2" }, { upsert: true });
    
    // Tasks
    const tasksData = [
      { _id: "task_1", name: "Implement user authentication", jobId: "job_1", allocatedHours: 8, status: "To Do", assignedBy: "Vanessa Lobo" },
      { _id: "task_2", name: "Design dashboard wireframes", jobId: "job_2", allocatedHours: 6, status: "In Progress", assignedBy: "Vanessa Lobo" },
      { _id: "task_3", name: "Schema Migration", jobId: "job_3", allocatedHours: 4, status: "Completed", assignedBy: "Vanessa Lobo" }
    ];
    for (const t of tasksData) await Task.findOneAndUpdate({ _id: t._id }, t, { upsert: true });

    // Time Logs
    await TimeLog.findOneAndUpdate({ _id: "log_1" }, { taskId: "task_1", userId: "shameer", loggedHours: 2.5, notes: "Initial setup", date: new Date() }, { upsert: true });

    // Config
    const configs = ["Time & Attendance", "Leave Management", "Payroll Integration"];
    for (const c of configs) await ModuleConfig.findOneAndUpdate({ _id: c }, { enabled: c !== "Payroll Integration" }, { upsert: true });

    // Announcements & Holidays (for the monitor counts)
    await Announcement.findOneAndUpdate({ _id: "ann_1" }, { title: "New Policy", content: "Work from home", authorId: "sam" }, { upsert: true });
    await Holiday.findOneAndUpdate({ _id: "hol_1" }, { name: "New Year", date: new Date("2024-01-01") }, { upsert: true });
    await Attendance.findOneAndUpdate({ _id: "att_1" }, { userId: "shameer", checkIn: new Date() }, { upsert: true });

    console.log("Database seeded successfully.");
  } catch (error) {
    console.error("Seeding error:", error);
  }
};

module.exports = db;
