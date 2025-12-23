const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const dashboardController = require('../controllers/dashboardController');
const taskController = require('../controllers/taskController');
const timeLogController = require('../controllers/timeLogController');
const adminController = require('../controllers/adminController');
const reportController = require('../controllers/reportController');

const { verifyToken, authorize } = require('../middleware/auth');

// --- Auth ---
router.post('/auth/login', authController.login);
router.get('/auth/me', verifyToken, authController.getMe);

// --- Users ---
router.get('/users', verifyToken, authorize(['Admin', 'HR', 'Scrum Master', 'Employee']), userController.getAllUsers);
router.get('/users/:id', verifyToken, userController.getUserById);
router.post('/users', verifyToken, authorize(['Admin']), userController.createUser);
router.put('/users/:id', verifyToken, authorize(['Admin']), userController.updateUser);
router.delete('/users/:id', verifyToken, authorize(['Admin']), userController.deleteUser);

// --- Dashboards ---
router.get('/dashboards/employee/:userId', verifyToken, dashboardController.getEmployeeDashboard);
router.get('/dashboards/scrum-master/:teamId', verifyToken, authorize(['Scrum Master', 'Admin']), dashboardController.getScrumMasterDashboard);
router.get('/dashboards/reports', verifyToken, authorize(['Admin', 'HR']), dashboardController.getReportsDashboard);
router.get('/dashboards/admin', verifyToken, authorize(['Admin']), dashboardController.getAdminDashboard);

// --- Tasks ---
router.get('/tasks', verifyToken, taskController.getTasks);
router.get('/tasks/:id', verifyToken, taskController.getTaskById);
router.put('/tasks/:id/status', verifyToken, taskController.updateTaskStatus);
router.post('/tasks/suggest-plan', verifyToken, taskController.suggestPlan);
// Admin Task Management
router.post('/tasks', verifyToken, authorize(['Admin', 'Scrum Master']), adminController.createTask);
router.put('/tasks/:id', verifyToken, authorize(['Admin', 'Scrum Master']), adminController.updateTask);
router.delete('/tasks/:id', verifyToken, authorize(['Admin', 'Scrum Master']), adminController.deleteTask);

// --- TimeLogs ---
router.get('/timelogs', verifyToken, timeLogController.getTimeLogs);
router.post('/timelogs', verifyToken, timeLogController.createTimeLog);

// --- Master Data (Admin) ---
router.get('/clients', verifyToken, authorize(['Admin']), adminController.getClients);
router.post('/clients', verifyToken, authorize(['Admin']), adminController.createClient);
router.put('/clients/:id', verifyToken, authorize(['Admin']), adminController.updateClient);
router.delete('/clients/:id', verifyToken, authorize(['Admin']), adminController.deleteClient);

router.get('/projects', verifyToken, authorize(['Admin', 'Scrum Master', 'HR', 'Employee']), adminController.getProjects);
router.post('/projects', verifyToken, authorize(['Admin']), adminController.createProject);
router.put('/projects/:id', verifyToken, authorize(['Admin']), adminController.updateProject);
router.delete('/projects/:id', verifyToken, authorize(['Admin']), adminController.deleteProject);

router.get('/teams', verifyToken, authorize(['Admin', 'Scrum Master', 'HR', 'Employee']), adminController.getTeams);
router.post('/teams', verifyToken, authorize(['Admin']), adminController.createTeam);
router.put('/teams/:id', verifyToken, authorize(['Admin']), adminController.updateTeam);
router.delete('/teams/:id', verifyToken, authorize(['Admin']), adminController.deleteTeam);

router.get('/jobs', verifyToken, authorize(['Admin']), adminController.getJobs);
router.post('/jobs', verifyToken, authorize(['Admin']), adminController.createJob);

// --- Config ---
router.get('/config/modules', verifyToken, authorize(['Admin']), adminController.getModules);
router.put('/config/modules/:moduleName', verifyToken, authorize(['Admin']), adminController.updateModule);

// --- Reports ---
router.get('/reports/timesheet', verifyToken, authorize(['Admin', 'HR']), reportController.getTimesheetReport);
router.get('/reports/leave-balance/:userId', verifyToken, reportController.getLeaveBalance);

module.exports = router;