
const Sequelize = require('sequelize');
const config = require('../config');

let sequelize;

// Configuration for Sequelize
const dbConfig = {
  host: config.DB.HOST,
  port: config.DB.PORT,
  dialect: config.DB.DIALECT,
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};

// SQLite specific config
if (config.DB.DIALECT === 'sqlite') {
  dbConfig.storage = config.DB.STORAGE;
  // SQLite doesn't need host/user/password, but we initialize nicely
  sequelize = new Sequelize(dbConfig);
} else {
  // MySQL/Postgres initialization
  sequelize = new Sequelize(
    config.DB.NAME,
    config.DB.USER,
    config.DB.PASSWORD,
    dbConfig
  );
}

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// --- Define Models ---

// Users
db.User = sequelize.define('user', {
  id: { type: Sequelize.STRING, primaryKey: true },
  name: { type: Sequelize.STRING },
  email: { type: Sequelize.STRING, unique: true },
  password: { type: Sequelize.STRING },
  role: { type: Sequelize.STRING }, // 'Admin', 'HR', 'Employee', 'Scrum Master'
  avatarUrl: { type: Sequelize.STRING },
  teamId: { type: Sequelize.STRING, allowNull: true }
});

// Teams
db.Team = sequelize.define('team', {
  id: { type: Sequelize.STRING, primaryKey: true },
  name: { type: Sequelize.STRING }
});

// Clients
db.Client = sequelize.define('client', {
  id: { type: Sequelize.STRING, primaryKey: true },
  name: { type: Sequelize.STRING }
});

// Projects
db.Project = sequelize.define('project', {
  id: { type: Sequelize.STRING, primaryKey: true },
  name: { type: Sequelize.STRING }
});

// Jobs
db.Job = sequelize.define('job', {
  id: { type: Sequelize.STRING, primaryKey: true },
  name: { type: Sequelize.STRING }
});

// Tasks
db.Task = sequelize.define('task', {
  id: { type: Sequelize.STRING, primaryKey: true },
  name: { type: Sequelize.STRING },
  allocatedHours: { type: Sequelize.FLOAT, defaultValue: 0 },
  status: { type: Sequelize.STRING, defaultValue: 'To Do' }, // 'To Do', 'In Progress', 'Completed'
  assignedBy: { type: Sequelize.STRING }
});

// TimeLogs
db.TimeLog = sequelize.define('timelog', {
  id: { type: Sequelize.STRING, primaryKey: true },
  loggedHours: { type: Sequelize.FLOAT },
  notes: { type: Sequelize.TEXT },
  date: { type: Sequelize.DATE }
});

// Leave Balances
db.LeaveBalance = sequelize.define('leave_balance', {
  userId: { type: Sequelize.STRING, primaryKey: true },
  annual: { type: Sequelize.INTEGER, defaultValue: 0 },
  sick: { type: Sequelize.INTEGER, defaultValue: 0 },
  casual: { type: Sequelize.INTEGER, defaultValue: 0 }
});

// Module Configs (Admin)
db.ModuleConfig = sequelize.define('module_config', {
  name: { type: Sequelize.STRING, primaryKey: true },
  enabled: { type: Sequelize.BOOLEAN, defaultValue: true }
});

// --- Relationships ---

// User -> Team
db.Team.hasMany(db.User, { foreignKey: 'teamId' });
db.User.belongsTo(db.Team, { foreignKey: 'teamId' });

// Project -> Client
db.Client.hasMany(db.Project, { foreignKey: 'clientId' });
db.Project.belongsTo(db.Client, { foreignKey: 'clientId' });

// Job -> Project
db.Project.hasMany(db.Job, { foreignKey: 'projectId' });
db.Job.belongsTo(db.Project, { foreignKey: 'projectId' });

// Task -> Job
db.Job.hasMany(db.Task, { foreignKey: 'jobId' });
db.Task.belongsTo(db.Job, { foreignKey: 'jobId' });

// TimeLog -> Task
db.Task.hasMany(db.TimeLog, { foreignKey: 'taskId' });
db.TimeLog.belongsTo(db.Task, { foreignKey: 'taskId' });

// TimeLog -> User
db.User.hasMany(db.TimeLog, { foreignKey: 'userId' });
db.TimeLog.belongsTo(db.User, { foreignKey: 'userId' });

// LeaveBalance -> User
db.User.hasOne(db.LeaveBalance, { foreignKey: 'userId' });
db.LeaveBalance.belongsTo(db.User, { foreignKey: 'userId' });


// --- Seeder Function (Run if DB is empty) ---
db.seed = async () => {
  try {
    const count = await db.User.count();
    if (count > 0) return;

    console.log("Seeding initial data...");

    await db.Team.create({ id: "team_alpha", name: "Alpha Squad" });

    await db.User.bulkCreate([
      { id: "emp_1", name: "Alex Doe", email: "alex@neo.com", password: "password", role: "Employee", avatarUrl: "https://i.pravatar.cc/150?u=emp_1", teamId: "team_alpha" },
      { id: "emp_2", name: "Liam Gallagher", email: "liam@neo.com", password: "password", role: "Scrum Master", avatarUrl: "https://i.pravatar.cc/150?u=emp_2", teamId: "team_alpha" },
      { id: "emp_3", name: "Jane Smith", email: "jane@neo.com", password: "password", role: "Employee", avatarUrl: "https://i.pravatar.cc/150?u=emp_3", teamId: "team_alpha" },
      { id: "admin_1", name: "Sarah Connor", email: "admin@neo.com", password: "admin", role: "Admin", avatarUrl: "https://i.pravatar.cc/150?u=admin_1" },
      { id: "hr_1", name: "Priya Sharma", email: "hr@neo.com", password: "hr", role: "HR", avatarUrl: "https://i.pravatar.cc/150?u=hr_1" }
    ]);

    await db.Client.bulkCreate([
      { id: "cli_1", name: "Innovate Corp" },
      { id: "cli_2", name: "Quantum Solutions" }
    ]);

    await db.Project.bulkCreate([
      { id: "proj_1", name: "Project Phoenix", clientId: "cli_1" },
      { id: "proj_2", name: "Orion Platform", clientId: "cli_2" }
    ]);

    await db.Job.bulkCreate([
      { id: "job_1", name: "Backend Development", projectId: "proj_1" },
      { id: "job_2", name: "UI/UX Design", projectId: "proj_1" },
      { id: "job_3", name: "Database Optimization", projectId: "proj_2" }
    ]);

    await db.Task.bulkCreate([
      { id: "task_1", name: "Implement user authentication", jobId: "job_1", allocatedHours: 8, status: "To Do", assignedBy: "Liam Gallagher" },
      { id: "task_2", name: "Design dashboard wireframes", jobId: "job_2", allocatedHours: 6, status: "In Progress", assignedBy: "Liam Gallagher" },
      { id: "task_3", name: "Schema Migration", jobId: "job_3", allocatedHours: 4, status: "Completed", assignedBy: "Liam Gallagher" }
    ]);

    await db.TimeLog.bulkCreate([
      { id: "log_1", taskId: "task_1", userId: "emp_1", loggedHours: 2.5, notes: "Initial setup", date: new Date("2024-07-20T10:30:00Z") },
      { id: "log_2", taskId: "task_1", userId: "emp_1", loggedHours: 1.5, notes: "Auth middleware", date: new Date("2024-07-20T14:00:00Z") },
      { id: "log_3", taskId: "task_2", userId: "emp_3", loggedHours: 3.0, notes: "Figma sketches", date: new Date("2024-07-20T09:15:00Z") }
    ]);

    await db.LeaveBalance.bulkCreate([
      { userId: "emp_1", annual: 12, sick: 5, casual: 2 },
      { userId: "emp_2", annual: 15, sick: 2, casual: 5 },
      { userId: "emp_3", annual: 10, sick: 10, casual: 1 }
    ]);

    await db.ModuleConfig.bulkCreate([
      { name: "Time & Attendance", enabled: true },
      { name: "Leave Management", enabled: true },
      { name: "Payroll Integration", enabled: false }
    ]);

    console.log("Seeding complete.");
  } catch (error) {
    console.error("Seeding error:", error);
  }
};

module.exports = db;
