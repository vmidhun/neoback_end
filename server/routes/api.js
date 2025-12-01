
const express = require('express');
const router = express.Router();

// Import Controllers
const authController = require('../controllers/authController');
const projectController = require('../controllers/projectController');
const timesheetController = require('../controllers/timesheetController');

// Import Middleware
const authMiddleware = require('../middleware/auth');

// --- Auth Routes ---
router.post('/auth/login', authController.login);
router.post('/auth/logout', authController.logout);
router.get('/auth/me', authMiddleware.verifyToken, authController.getCurrentUser);

// --- Project Routes ---
router.get('/projects', authMiddleware.verifyToken, projectController.getProjects);
router.post('/projects', authMiddleware.verifyToken, projectController.createProject);
// Add specific project routes here (e.g., getById, update, delete)

// --- Timesheet Routes ---
router.get('/timesheets', authMiddleware.verifyToken, timesheetController.getTimesheets);
router.post('/timesheets', authMiddleware.verifyToken, timesheetController.createEntry);
// Add specific timesheet routes here (e.g., approve, reject)

module.exports = router;
