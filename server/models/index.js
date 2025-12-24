
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
  role: { type: String, enum: ['Admin', 'HR', 'Employee', 'Manager'], default: 'Employee' },
  avatarUrl: { type: String },
  teamId: { type: String, ref: 'Team' },
  designation: { type: String },
  hierarchyLevel: { type: Number, default: 3 }, // 1: Director, 2: Lead/Manager, 3: Senior/Mid/Exec
  reportingManagerId: { type: String, ref: 'User' },

  // HRMS Sections
  personalInfo: {
    dob: Date,
    gender: { type: String },
    maritalStatus: { type: String },
    bloodGroup: { type: String },
    nationality: { type: String },
    personalEmail: { type: String },
    mobileNumber: { type: String },
    secondaryNumber: { type: String },
    currentAddress: { type: String },
    permanentAddress: { type: String },
    linkedinProfile: { type: String }
  },
  employmentDetails: {
    empId: { type: String }, // e.g., NI001
    doj: Date,
    confirmationDate: Date,
    employmentType: { type: String, enum: ['Full-time', 'Contract', 'Intern'] },
    employmentStatus: { type: String, enum: ['Active', 'Notice Period', 'Terminated', 'Sabbatical'], default: 'Active' },
    officialDesignation: { type: String }, // From Payslip
    workLocation: { type: String }
  },
  financialDetails: {
    bankName: { type: String },
    accountHolderName: { type: String },
    accountNumber: { type: String },
    ifscCode: { type: String },
    panCardNumber: { type: String },
    aadhaarNumber: { type: String },
    uanNumber: { type: String },
    pfAccountNumber: { type: String }
  },
  documents: {
    resumeUrl: { type: String },
    offerLetterUrl: { type: String },
    appointmentLetterUrl: { type: String },
    idProofUrl: { type: String },
    photoUrl: { type: String }
  },
  emergencyContacts: [{
    name: { type: String },
    relationship: { type: String },
    phone: { type: String },
    email: { type: String }
  }]
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
  clientId: { type: String, ref: 'Client', required: true },
  workCalendarId: { type: String, ref: 'WorkCalendar' },
  timesheetConfig: {
    submissionFrequency: { type: String, enum: ['Weekly', 'Bi-Weekly', 'Monthly'], default: 'Weekly' },
    requireClientApproval: { type: Boolean, default: false }
  }
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
  _id: { type: String, required: true }, // usually userId
  year: { type: Number, required: true },
  annual: { type: Number, default: 0 },
  sick: { type: Number, default: 0 },
  casual: { type: Number, default: 0 },
  maternity: { type: Number, default: 0 },
  paternity: { type: Number, default: 0 },
  lossOfPay: { type: Number, default: 0 }, // Track how many LOP days taken
  carriedOver: { type: Number, default: 0 }
}, { timestamps: true, collection: 'leave_balances' });
// Compound index to ensure one balance record per user per year
LeaveBalanceSchema.index({ _id: 1, year: 1 }, { unique: true });

const LeaveRequestSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  userId: { type: String, ref: 'User', required: true },
  leaveType: { type: String, enum: ['Annual', 'Sick', 'Casual', 'Maternity', 'Paternity', 'LossOfPay'], required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  daysCount: { type: Number, required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'], default: 'Pending' },
  approverId: { type: String, ref: 'User' },
  rejectionReason: { type: String },
  isLossOfPay: { type: Boolean, default: false } // Flag if this specific request is LOP
}, { timestamps: true, collection: 'leave_requests' });

const ModuleConfigSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  enabled: { type: Boolean, default: true }
}, { timestamps: true, collection: 'module_configs' });

const LeaveTypeSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // slug, e.g., 'annual-leave'
  name: { type: String, required: true },
  description: { type: String },
  annualQuota: { type: Number, default: 0 },
  isPaid: { type: Boolean, default: true },
  color: { type: String, default: '#00AEEF' }
}, { timestamps: true, collection: 'leave_types' });

const WorkCalendarSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  workingDays: [{ type: Number }], // 0=Sun, 1=Mon, ..., 6=Sat
  holidayIds: [{ type: String, ref: 'Holiday' }],
  timezone: { type: String, default: 'UTC' }
}, { timestamps: true, collection: 'work_calendars' });

const TimesheetSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  userId: { type: String, ref: 'User', required: true },
  periodStartDate: { type: Date, required: true },
  periodEndDate: { type: Date, required: true },
  status: { type: String, enum: ['Draft', 'Submitted', 'Approved', 'Rejected'], default: 'Draft' },
  approverId: { type: String, ref: 'User' },
  timeLogs: [{ type: String, ref: 'TimeLog' }],
  rejectionReason: { type: String }
}, { timestamps: true, collection: 'timesheets' });

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
const LeaveRequest = mongoose.models.LeaveRequest || mongoose.model('LeaveRequest', LeaveRequestSchema);
const ModuleConfig = mongoose.models.ModuleConfig || mongoose.model('ModuleConfig', ModuleConfigSchema);
const Announcement = mongoose.models.Announcement || mongoose.model('Announcement', AnnouncementSchema);
const Holiday = mongoose.models.Holiday || mongoose.model('Holiday', HolidaySchema);
const Attendance = mongoose.models.Attendance || mongoose.model('Attendance', AttendanceSchema);
const LeaveType = mongoose.models.LeaveType || mongoose.model('LeaveType', LeaveTypeSchema);
const WorkCalendar = mongoose.models.WorkCalendar || mongoose.model('WorkCalendar', WorkCalendarSchema);
const Timesheet = mongoose.models.Timesheet || mongoose.model('Timesheet', TimesheetSchema);

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
  LeaveRequest,
  ModuleConfig,
  Announcement,
  Holiday,
  Attendance,
  LeaveType,
  WorkCalendar,
  Timesheet
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

    const fs = require('fs');
    const path = require('path');
    const seedDir = path.join(__dirname, '../seed_data');

    const loadData = (file) => {
      try {
        const p = path.join(seedDir, file);
        if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
      } catch (e) { console.error(`Error reading ${file}`, e); }
      return null;
    };

    const seedModel = async (Model, fileName, idField = '_id') => {
      const data = loadData(fileName);
      if (data && data.length > 0) {
        console.log(`Seeding ${Model.modelName} from ${fileName} (${data.length} records)`);
        for (const item of data) {
          await Model.findOneAndUpdate({ [idField]: item[idField] }, item, { upsert: true });
        }
      }
    };

    await seedModel(Team, 'teams_seed.json');
    await seedModel(User, 'users_seed.json');
    await seedModel(Client, 'clients_seed.json');
    await seedModel(Project, 'projects_seed.json');
    await seedModel(Job, 'jobs_seed.json');
    await seedModel(Task, 'tasks_seed.json');
    await seedModel(TimeLog, 'timelogs_seed.json');
    await seedModel(LeaveBalance, 'leave_balances_seed.json');
    await seedModel(LeaveRequest, 'leave_requests_seed.json');
    await seedModel(ModuleConfig, 'module_configs_seed.json');
    await seedModel(Announcement, 'announcements_seed.json');
    await seedModel(Holiday, 'holidays_seed.json');
    await seedModel(Attendance, 'attendance_seed.json');
    await seedModel(LeaveType, 'leave_types_seed.json');
    await seedModel(WorkCalendar, 'work_calendars_seed.json');
    await seedModel(Timesheet, 'timesheets_seed.json');

    console.log("Database seeded successfully.");
  } catch (error) {
    console.error("Seeding error:", error);
  }
};

module.exports = db;
