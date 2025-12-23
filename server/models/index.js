
const mongoose = require('mongoose');
const config = require('../config');

const connectDB = async () => {
  try {
    await mongoose.connect(config.MONGODB_URI, {
      dbName: config.DB.NAME
    });
    console.log("Connected to MongoDB Atlas");
  } catch (err) {
    console.error("MongoDB Connection Error:", err.message);
    throw err;
  }
};

// --- Define Schemas ---

const UserSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['Admin', 'HR', 'Employee', 'Scrum Master'], default: 'Employee' },
  avatarUrl: { type: String },
  teamId: { type: String, ref: 'Team' }
}, { timestamps: true });

const TeamSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true }
}, { timestamps: true });

const ClientSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true }
}, { timestamps: true });

const ProjectSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  clientId: { type: String, ref: 'Client', required: true }
}, { timestamps: true });

const JobSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  projectId: { type: String, ref: 'Project', required: true }
}, { timestamps: true });

const TaskSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  allocatedHours: { type: Number, default: 0 },
  status: { type: String, enum: ['To Do', 'In Progress', 'Completed'], default: 'To Do' },
  assignedBy: { type: String },
  jobId: { type: String, ref: 'Job', required: true }
}, { timestamps: true });

const TimeLogSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  taskId: { type: String, ref: 'Task', required: true },
  userId: { type: String, ref: 'User', required: true },
  loggedHours: { type: Number, required: true },
  notes: { type: String },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

const LeaveBalanceSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // userId
  annual: { type: Number, default: 0 },
  sick: { type: Number, default: 0 },
  casual: { type: Number, default: 0 }
}, { timestamps: true });

const ModuleConfigSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // name
  enabled: { type: Boolean, default: true }
}, { timestamps: true });

// --- NEW RELEVANT TABLES ---

const AnnouncementSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  authorId: { type: String, ref: 'User' },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' }
}, { timestamps: true });

const HolidaySchema = new mongoose.Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  date: { type: Date, required: true },
  description: { type: String }
}, { timestamps: true });

const AttendanceSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  userId: { type: String, ref: 'User', required: true },
  checkIn: { type: Date, required: true },
  checkOut: { type: Date },
  status: { type: String, enum: ['On Time', 'Late', 'Half Day', 'Absent'], default: 'On Time' }
}, { timestamps: true });

// --- Register Models ---
const User = mongoose.model('User', UserSchema);
const Team = mongoose.model('Team', TeamSchema);
const Client = mongoose.model('Client', ClientSchema);
const Project = mongoose.model('Project', ProjectSchema);
const Job = mongoose.model('Job', JobSchema);
const Task = mongoose.model('Task', TaskSchema);
const TimeLog = mongoose.model('TimeLog', TimeLogSchema);
const LeaveBalance = mongoose.model('LeaveBalance', LeaveBalanceSchema);
const ModuleConfig = mongoose.model('ModuleConfig', ModuleConfigSchema);
const Announcement = mongoose.model('Announcement', AnnouncementSchema);
const Holiday = mongoose.model('Holiday', HolidaySchema);
const Attendance = mongoose.model('Attendance', AttendanceSchema);

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

// --- Seeder Function ---
db.seed = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) return;

    console.log("Seeding MongoDB with initial data...");

    await Team.create({ _id: "team_alpha", name: "Alpha Squad" });

    await User.insertMany([
      { _id: "emp_1", name: "Alex Doe", email: "alex@neo.com", password: "password", role: "Employee", avatarUrl: "https://i.pravatar.cc/150?u=emp_1", teamId: "team_alpha" },
      { _id: "emp_2", name: "Liam Gallagher", email: "liam@neo.com", password: "password", role: "Scrum Master", avatarUrl: "https://i.pravatar.cc/150?u=emp_2", teamId: "team_alpha" },
      { _id: "emp_3", name: "Jane Smith", email: "jane@neo.com", password: "password", role: "Employee", avatarUrl: "https://i.pravatar.cc/150?u=emp_3", teamId: "team_alpha" },
      { _id: "admin_1", name: "Sarah Connor", email: "admin@neo.com", password: "admin", role: "Admin", avatarUrl: "https://i.pravatar.cc/150?u=admin_1" },
      { _id: "hr_1", name: "Priya Sharma", email: "hr@neo.com", password: "hr", role: "HR", avatarUrl: "https://i.pravatar.cc/150?u=hr_1" }
    ]);

    await Client.insertMany([
      { _id: "cli_1", name: "Innovate Corp" },
      { _id: "cli_2", name: "Quantum Solutions" }
    ]);

    await Project.insertMany([
      { _id: "proj_1", name: "Project Phoenix", clientId: "cli_1" },
      { _id: "proj_2", name: "Orion Platform", clientId: "cli_2" }
    ]);

    await Job.insertMany([
      { _id: "job_1", name: "Backend Development", projectId: "proj_1" },
      { _id: "job_2", name: "UI/UX Design", projectId: "proj_1" },
      { _id: "job_3", name: "Database Optimization", projectId: "proj_2" }
    ]);

    await Task.insertMany([
      { _id: "task_1", name: "Implement user authentication", jobId: "job_1", allocatedHours: 8, status: "To Do", assignedBy: "Liam Gallagher" },
      { _id: "task_2", name: "Design dashboard wireframes", jobId: "job_2", allocatedHours: 6, status: "In Progress", assignedBy: "Liam Gallagher" },
      { _id: "task_3", name: "Schema Migration", jobId: "job_3", allocatedHours: 4, status: "Completed", assignedBy: "Liam Gallagher" }
    ]);

    await TimeLog.insertMany([
      { _id: "log_1", taskId: "task_1", userId: "emp_1", loggedHours: 2.5, notes: "Initial setup", date: new Date("2024-07-20T10:30:00Z") },
      { _id: "log_2", taskId: "task_1", userId: "emp_1", loggedHours: 1.5, notes: "Auth middleware", date: new Date("2024-07-20T14:00:00Z") },
      { _id: "log_3", taskId: "task_2", userId: "emp_3", loggedHours: 3.0, notes: "Figma sketches", date: new Date("2024-07-20T09:15:00Z") }
    ]);

    await LeaveBalance.insertMany([
      { _id: "emp_1", annual: 12, sick: 5, casual: 2 },
      { _id: "emp_2", annual: 15, sick: 2, casual: 5 },
      { _id: "emp_3", annual: 10, sick: 10, casual: 1 }
    ]);

    await ModuleConfig.insertMany([
      { _id: "Time & Attendance", enabled: true },
      { _id: "Leave Management", enabled: true },
      { _id: "Payroll Integration", enabled: false }
    ]);

    await Announcement.insertMany([
      { _id: "ann_1", title: "Quarterly Performance Review", content: "Reviews will start next week.", authorId: "admin_1", priority: "High" },
      { _id: "ann_2", title: "New Coffee Machine!", content: "Check out the breakroom.", authorId: "hr_1", priority: "Low" }
    ]);

    await Holiday.insertMany([
      { _id: "hol_1", name: "New Year's Day", date: new Date("2025-01-01"), description: "Public holiday" },
      { _id: "hol_2", name: "Independence Day", date: new Date("2024-07-04"), description: "National holiday" }
    ]);

    await Attendance.insertMany([
      { _id: "att_1", userId: "emp_1", checkIn: new Date(), status: "On Time" }
    ]);

    console.log("Seeding complete.");
  } catch (error) {
    console.error("Seeding error:", error);
  }
};

module.exports = db;
