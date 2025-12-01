
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
router.get('/users', verifyToken, authorize(['Admin', 'HR', 'Scrum Master']), userController.getAllUsers);
router.get('/users/:id', verifyToken, userController.getUserById);

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

// --- TimeLogs ---
router.get('/timelogs', verifyToken, timeLogController.getTimeLogs);
router.post('/timelogs', verifyToken, timeLogController.createTimeLog);

// --- Master Data (Admin) ---
router.get('/clients', verifyToken, authorize(['Admin']), adminController.getClients);
router.post('/clients', verifyToken, authorize(['Admin']), adminController.createClient);
router.put('/clients/:id', verifyToken, authorize(['Admin']), adminController.updateClient);
router.delete('/clients/:id', verifyToken, authorize(['Admin']), adminController.deleteClient);

router.get('/projects', verifyToken, authorize(['Admin']), adminController.getProjects);
router.post('/projects', verifyToken, authorize(['Admin']), adminController.createProject);

router.get('/jobs', verifyToken, authorize(['Admin']), adminController.getJobs);
router.post('/jobs', verifyToken, authorize(['Admin']), adminController.createJob);

// --- Config ---
router.get('/config/modules', verifyToken, authorize(['Admin']), adminController.getModules);
router.put('/config/modules/:moduleName', verifyToken, authorize(['Admin']), adminController.updateModule);

// --- Reports ---
router.get('/reports/timesheet', verifyToken, authorize(['Admin', 'HR']), reportController.getTimesheetReport);
router.get('/reports/leave-balance/:userId', verifyToken, reportController.getLeaveBalance);

module.exports = router;
