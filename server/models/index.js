
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
      serverSelectionTimeoutMS: 8000, // Reduced for Vercel (10s limit)
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
  teamId: { type: String, ref: 'Team' }
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

db.seed = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) return;

    console.log("Seeding database...");
    await Team.findOneAndUpdate({ _id: "team_alpha" }, { name: "Alpha Squad" }, { upsert: true });

    const userData = [
      { _id: "emp_1", name: "Alex Doe", email: "alex@neo.com", password: "password", role: "Employee", avatarUrl: "https://i.pravatar.cc/150?u=emp_1", teamId: "team_alpha" },
      { _id: "emp_2", name: "Liam Gallagher", email: "liam@neo.com", password: "password", role: "Scrum Master", avatarUrl: "https://i.pravatar.cc/150?u=emp_2", teamId: "team_alpha" },
      { _id: "admin_1", name: "Sarah Connor", email: "admin@neo.com", password: "admin", role: "Admin", avatarUrl: "https://i.pravatar.cc/150?u=admin_1" }
    ];
    
    for (const u of userData) {
      await User.findOneAndUpdate({ _id: u._id }, u, { upsert: true });
    }

    await Client.findOneAndUpdate({ _id: "cli_1" }, { name: "Innovate Corp" }, { upsert: true });
    await Project.findOneAndUpdate({ _id: "proj_1" }, { name: "Project Phoenix", clientId: "cli_1" }, { upsert: true });
    await Job.findOneAndUpdate({ _id: "job_1" }, { name: "Backend Development", projectId: "proj_1" }, { upsert: true });
    
    await Task.findOneAndUpdate({ _id: "task_1" }, { 
        name: "Implement user authentication", 
        jobId: "job_1", 
        allocatedHours: 8, 
        status: "To Do", 
        assignedBy: "Liam Gallagher" 
    }, { upsert: true });

    await ModuleConfig.findOneAndUpdate({ _id: "Time & Attendance" }, { enabled: true }, { upsert: true });
  } catch (error) {
    console.error("Seeding error:", error);
  }
};

module.exports = db;
