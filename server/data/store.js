
// In-memory simulated database

const users = [
  { id: "emp_1", name: "Alex Doe", email: "alex@neo.com", password: "password", role: "Employee", avatarUrl: "https://i.pravatar.cc/150?u=emp_1", teamId: "team_alpha" },
  { id: "emp_2", name: "Liam Gallagher", email: "liam@neo.com", password: "password", role: "Scrum Master", avatarUrl: "https://i.pravatar.cc/150?u=emp_2", teamId: "team_alpha" },
  { id: "emp_3", name: "Jane Smith", email: "jane@neo.com", password: "password", role: "Employee", avatarUrl: "https://i.pravatar.cc/150?u=emp_3", teamId: "team_alpha" },
  { id: "admin_1", name: "Sarah Connor", email: "admin@neo.com", password: "admin", role: "Admin", avatarUrl: "https://i.pravatar.cc/150?u=admin_1" },
  { id: "hr_1", name: "Priya Sharma", email: "hr@neo.com", password: "hr", role: "HR", avatarUrl: "https://i.pravatar.cc/150?u=hr_1" }
];

const clients = [
  { id: "cli_1", name: "Innovate Corp" },
  { id: "cli_2", name: "Quantum Solutions" }
];

const projects = [
  { id: "proj_1", name: "Project Phoenix", clientId: "cli_1" },
  { id: "proj_2", name: "Orion Platform", clientId: "cli_2" }
];

const jobs = [
  { id: "job_1", name: "Backend Development", projectId: "proj_1" },
  { id: "job_2", name: "UI/UX Design", projectId: "proj_1" },
  { id: "job_3", name: "Database Optimization", projectId: "proj_2" }
];

const tasks = [
  { id: "task_1", name: "Implement user authentication", jobId: "job_1", allocatedHours: 8, status: "To Do", assignedBy: "Liam Gallagher" },
  { id: "task_2", name: "Design dashboard wireframes", jobId: "job_2", allocatedHours: 6, status: "In Progress", assignedBy: "Liam Gallagher" },
  { id: "task_3", name: "Schema Migration", jobId: "job_3", allocatedHours: 4, status: "Completed", assignedBy: "Liam Gallagher" }
];

const timeLogs = [
  { id: "log_1", taskId: "task_1", userId: "emp_1", loggedHours: 2.5, notes: "Initial setup", date: "2024-07-20T10:30:00Z" },
  { id: "log_2", taskId: "task_1", userId: "emp_1", loggedHours: 1.5, notes: "Auth middleware", date: "2024-07-20T14:00:00Z" },
  { id: "log_3", taskId: "task_2", userId: "emp_3", loggedHours: 3.0, notes: "Figma sketches", date: "2024-07-20T09:15:00Z" }
];

const modules = [
  { name: "Time & Attendance", enabled: true },
  { name: "Leave Management", enabled: true },
  { name: "Payroll Integration", enabled: false }
];

const teams = [
    { id: "team_alpha", name: "Alpha Squad" }
];

const leaves = {
    "emp_1": { annual: 12, sick: 5, casual: 2 },
    "emp_2": { annual: 15, sick: 2, casual: 5 },
    "emp_3": { annual: 10, sick: 10, casual: 1 }
};

module.exports = {
  users,
  clients,
  projects,
  jobs,
  tasks,
  timeLogs,
  modules,
  teams,
  leaves
};
