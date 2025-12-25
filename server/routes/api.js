
const express = require('express');
const router = express.Router();

// Import Controllers
const authController = require('../controllers/authController');
const projectController = require('../controllers/projectController');
const timesheetController = require('../controllers/timesheetController');
const taskController = require('../controllers/taskController');
const leaveController = require('../controllers/leaveController');
const standupController = require('../controllers/standupController');
const workCalendarController = require('../controllers/workCalendarController');
const policyController = require('../controllers/policyController');

// Import Middleware
const authMiddleware = require('../middleware/auth');

// --- Auth Routes ---
router.post('/auth/login', authController.login);
router.post('/auth/logout', authController.logout);
router.get('/auth/me', authMiddleware.verifyToken, authController.getCurrentUser);

// --- Policy Routes ---
router.get('/policies/leave-types', authMiddleware.verifyToken, policyController.getLeaveTypes);
router.post('/policies/leave-types', authMiddleware.verifyToken, policyController.createLeaveType);
router.put('/policies/leave-types/:id', authMiddleware.verifyToken, policyController.updateLeaveType);
router.delete('/policies/leave-types/:id', authMiddleware.verifyToken, policyController.deleteLeaveType);
router.get('/policies/data-retention', authMiddleware.verifyToken, policyController.getDataRetention);
router.put('/policies/data-retention', authMiddleware.verifyToken, policyController.updateDataRetention);

// --- Project Routes ---
router.get('/projects', authMiddleware.verifyToken, projectController.getProjects);
router.post('/projects', authMiddleware.verifyToken, projectController.createProject);

// --- Work Calendar Routes ---
router.get('/work-calendars', authMiddleware.verifyToken, workCalendarController.getCalendars);
router.post('/work-calendars', authMiddleware.verifyToken, workCalendarController.createCalendar);
router.put('/work-calendars/:id', authMiddleware.verifyToken, workCalendarController.updateCalendar);
router.delete('/work-calendars/:id', authMiddleware.verifyToken, workCalendarController.deleteCalendar);

// --- Task Routes ---
router.get('/tasks', authMiddleware.verifyToken, taskController.getTasks);
router.get('/tasks/:id', authMiddleware.verifyToken, taskController.getTaskById);
router.put('/tasks/:id', authMiddleware.verifyToken, taskController.updateTaskStatus);
router.post('/tasks/suggest-plan', authMiddleware.verifyToken, taskController.suggestPlan);

// --- Leave Routes ---
router.post('/leaves/apply', authMiddleware.verifyToken, leaveController.applyLeave);
router.get('/leaves/my', authMiddleware.verifyToken, leaveController.getMyLeaves);
router.get('/leaves/balance/my', authMiddleware.verifyToken, leaveController.getMyBalance);
router.get('/leaves/pending', authMiddleware.verifyToken, leaveController.getPendingApprovals);
router.get('/leaves/calendar', authMiddleware.verifyToken, leaveController.getTeamCalendar);
router.put('/leaves/:id/status', authMiddleware.verifyToken, leaveController.updateLeaveStatus);

// --- Standup Routes ---
router.get('/standup/daily', authMiddleware.verifyToken, standupController.getDailyStandup);
router.post('/standup/session', authMiddleware.verifyToken, standupController.createOrUpdateSession);

// --- Timesheet Routes ---
router.get('/timesheets', authMiddleware.verifyToken, timesheetController.getTimesheets);
router.post('/timesheets', authMiddleware.verifyToken, timesheetController.createEntry);

module.exports = router;
