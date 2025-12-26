const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const dashboardController = require('../controllers/dashboardController');
const taskController = require('../controllers/taskController');
const timeLogController = require('../controllers/timeLogController');
const adminController = require('../controllers/adminController');
const reportController = require('../controllers/reportController');
const leaveController = require('../controllers/leaveController');
const policyController = require('../controllers/policyController');
const timesheetController = require('../controllers/timesheetController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../../public/team');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Use original name or timestamp to avoid collisions?
        // User wants to dump photographs. Let's keep original name but sanitize or use ID if passed?
        // Let's use timestamp + original name for safety, but user might want cleaner names.
        // For simple usage: original name.
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

const { verifyToken, authorize } = require('../middleware/auth');

// --- Uploads ---
router.post('/upload/image', verifyToken, upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    // Return the URL relative to server root
    const fileUrl = `/team/${req.file.filename}`;
    res.json({ url: fileUrl });
});

const tenantController = require('../controllers/tenantController');
const superAdminController = require('../controllers/superAdminController');
const entitlementController = require('../controllers/entitlementController');
const { ensureFeatureEnabled } = require('../middleware/subscriptionMiddleware');

// --- Auth ---
router.post('/auth/login', authController.login);
router.get('/auth/me', verifyToken, authController.getMe);

// --- Tenants (SuperAdmin) ---
// Note: Some overlap with superAdminController, keeping legacy tenantController for basic CRUD if needed, 
// but preferred to use new Super Admin routes.
router.get('/tenants', verifyToken, authorize(['SuperAdmin']), tenantController.getTenants);
router.post('/tenants', verifyToken, authorize(['SuperAdmin']), tenantController.createTenant);
router.put('/tenants/:id', verifyToken, authorize(['SuperAdmin']), tenantController.updateTenant);
router.delete('/tenants/:id', verifyToken, authorize(['SuperAdmin']), tenantController.deleteTenant);

// --- Super Admin Control Plane ---
router.get('/super/plans', verifyToken, authorize(['SuperAdmin']), superAdminController.getPlans);
router.post('/super/plans', verifyToken, authorize(['SuperAdmin']), superAdminController.createPlan);
router.put('/super/plans/:id', verifyToken, authorize(['SuperAdmin']), superAdminController.updatePlan);

router.get('/super/plans/:planId/features', verifyToken, authorize(['SuperAdmin']), superAdminController.getPlanFeatures);
router.post('/super/plans/:planId/features', verifyToken, authorize(['SuperAdmin']), superAdminController.bulkUpdateFeatures);

router.get('/super/tenants', verifyToken, authorize(['SuperAdmin']), superAdminController.getTenants);
router.patch('/super/tenants/:tenantId/status', verifyToken, authorize(['SuperAdmin']), superAdminController.updateTenantStatus);
router.get('/super/tenants/:tenantId/subscription', verifyToken, authorize(['SuperAdmin']), superAdminController.getSubscription);
router.post('/super/tenants/:tenantId/subscription', verifyToken, authorize(['SuperAdmin']), superAdminController.updateSubscription);

router.get('/super/metrics/overview', verifyToken, authorize(['SuperAdmin']), superAdminController.getMetrics);

// --- Tenant Entitlements ---
router.get('/tenant/entitlements', verifyToken, entitlementController.getMyEntitlements);

// --- Users ---
router.get('/users', verifyToken, authorize(['Admin', 'HR', 'Manager', 'Employee']), userController.getAllUsers);
router.get('/users/:id', verifyToken, userController.getUserById);
router.post('/users', verifyToken, authorize(['Admin']), userController.createUser);
router.put('/users/:id', verifyToken, authorize(['Admin']), userController.updateUser);
router.delete('/users/:id', verifyToken, authorize(['Admin']), userController.deleteUser);

// --- Dashboards ---
router.get('/dashboards/employee/:userId', verifyToken, dashboardController.getEmployeeDashboard);
router.get('/dashboards/manager/:teamId', verifyToken, authorize(['Manager', 'Admin']), dashboardController.getScrumMasterDashboard);
router.get('/dashboards/reports', verifyToken, authorize(['Admin', 'HR']), dashboardController.getReportsDashboard);
router.get('/dashboards/admin', verifyToken, authorize(['Admin']), dashboardController.getAdminDashboard);

// --- Tasks ---
router.get('/tasks', verifyToken, taskController.getTasks);
router.get('/tasks/:id', verifyToken, taskController.getTaskById);
router.put('/tasks/:id/status', verifyToken, taskController.updateTaskStatus);
router.post('/tasks/suggest-plan', verifyToken, taskController.suggestPlan);
// Admin Task Management
router.post('/tasks', verifyToken, authorize(['Admin', 'Manager']), adminController.createTask);
router.put('/tasks/:id', verifyToken, authorize(['Admin', 'Manager']), adminController.updateTask);
router.delete('/tasks/:id', verifyToken, authorize(['Admin', 'Manager']), adminController.deleteTask);

// --- TimeLogs ---
router.get('/timelogs', verifyToken, timeLogController.getTimeLogs);
router.post('/timelogs', verifyToken, timeLogController.createTimeLog);

// --- Master Data (Admin) ---
router.get('/clients', verifyToken, authorize(['Admin']), adminController.getClients);
router.post('/clients', verifyToken, authorize(['Admin']), adminController.createClient);
router.put('/clients/:id', verifyToken, authorize(['Admin']), adminController.updateClient);
router.delete('/clients/:id', verifyToken, authorize(['Admin']), adminController.deleteClient);

router.get('/projects', verifyToken, authorize(['Admin', 'Manager', 'HR', 'Employee']), ensureFeatureEnabled('project_management'), adminController.getProjects);
router.post('/projects', verifyToken, authorize(['Admin']), ensureFeatureEnabled('project_management'), adminController.createProject);
router.put('/projects/:id', verifyToken, authorize(['Admin']), ensureFeatureEnabled('project_management'), adminController.updateProject);
router.delete('/projects/:id', verifyToken, authorize(['Admin']), ensureFeatureEnabled('project_management'), adminController.deleteProject);

router.get('/teams', verifyToken, authorize(['Admin', 'Manager', 'HR', 'Employee']), adminController.getTeams);
router.post('/teams', verifyToken, authorize(['Admin']), adminController.createTeam);
router.put('/teams/:id', verifyToken, authorize(['Admin']), adminController.updateTeam);
router.delete('/teams/:id', verifyToken, authorize(['Admin']), adminController.deleteTeam);

router.get('/jobs', verifyToken, authorize(['Admin']), adminController.getJobs);
router.post('/jobs', verifyToken, authorize(['Admin']), adminController.createJob);

// --- Config ---
router.get('/config/modules', verifyToken, authorize(['Admin']), adminController.getModules);
router.put('/config/modules/:moduleName', verifyToken, authorize(['Admin']), adminController.updateModule);

// --- Leave Management ---
router.post('/leaves/apply', verifyToken, ensureFeatureEnabled('leave_management'), leaveController.applyLeave);
router.get('/leaves/my', verifyToken, ensureFeatureEnabled('leave_management'), leaveController.getMyLeaves);
router.get('/leaves/balance/my', verifyToken, ensureFeatureEnabled('leave_management'), leaveController.getMyBalance);
router.get('/leaves/pending', verifyToken, authorize(['Admin', 'HR', 'Manager', 'Employee']), ensureFeatureEnabled('leave_management'), leaveController.getPendingApprovals);
router.put('/leaves/:id/status', verifyToken, authorize(['Admin', 'HR', 'Manager', 'Employee']), ensureFeatureEnabled('leave_management'), leaveController.updateLeaveStatus);
router.get('/leaves/calendar', verifyToken, ensureFeatureEnabled('leave_management'), leaveController.getTeamCalendar);

const workCalendarController = require('../controllers/workCalendarController');
const standupController = require('../controllers/standupController');

// ... (existing imports)

// --- Standup Routes ---
router.get('/standup/daily', verifyToken, ensureFeatureEnabled('team_standup'), standupController.getDailyStandup);
router.post('/standup/session', verifyToken, ensureFeatureEnabled('team_standup'), standupController.createOrUpdateSession);

// --- HR Policy & Configuration ---
router.get('/policies/leave-types', verifyToken, ensureFeatureEnabled('leave_management'), policyController.getLeaveTypes);
router.post('/policies/leave-types', verifyToken, authorize(['Admin', 'HR']), ensureFeatureEnabled('leave_management'), policyController.createLeaveType);
router.put('/policies/leave-types/:id', verifyToken, authorize(['Admin', 'HR']), ensureFeatureEnabled('leave_management'), policyController.updateLeaveType);
router.delete('/policies/leave-types/:id', verifyToken, authorize(['Admin', 'HR']), ensureFeatureEnabled('leave_management'), policyController.deleteLeaveType);

router.get('/policies/calendars', verifyToken, workCalendarController.getCalendars);
router.post('/policies/calendars', verifyToken, authorize(['Admin', 'HR']), workCalendarController.createCalendar);
router.put('/policies/calendars/:id', verifyToken, authorize(['Admin', 'HR']), workCalendarController.updateCalendar);
router.delete('/policies/calendars/:id', verifyToken, authorize(['Admin', 'HR']), workCalendarController.deleteCalendar);

// --- Project Config Overrides ---
router.put('/projects/:projectId/timesheet-config', verifyToken, authorize(['Admin', 'Manager']), policyController.updateProjectTimesheetConfig);

// --- Timesheets ---
router.post('/timesheets/submit', verifyToken, ensureFeatureEnabled('timesheet'), timesheetController.submitTimesheet);
router.get('/timesheets', verifyToken, ensureFeatureEnabled('timesheet'), timesheetController.getTimesheets);
router.put('/timesheets/:id/status', verifyToken, authorize(['Admin', 'Manager']), ensureFeatureEnabled('timesheet'), timesheetController.updateTimesheetStatus);

// --- Reports ---
router.get('/reports/timesheet', verifyToken, authorize(['Admin', 'HR']), ensureFeatureEnabled('reports'), reportController.getTimesheetReport);
router.get('/reports/leave-balance/:userId', verifyToken, ensureFeatureEnabled('reports'), reportController.getLeaveBalance);

module.exports = router;