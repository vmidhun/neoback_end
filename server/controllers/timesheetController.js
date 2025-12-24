const { Timesheet, TimeLog, User, Project } = require('../models');

// Submit a timesheet
exports.submitTimesheet = async (req, res) => {
  try {
    const { userId, periodStartDate, periodEndDate, timeLogIds } = req.body;

    // Check if timesheet already exists for this period?
    // For simplicity, we assume one timesheet per period.

    // Find project manager to assign as approver? 
    // Or just default to reporting manager.
    const user = await User.findById(userId);
    const approverId = user.reportingManagerId;

    const timesheet = await Timesheet.create({
      _id: 'ts_' + Date.now(),
      userId,
      periodStartDate,
      periodEndDate,
      timeLogs: timeLogIds,
      status: 'Submitted',
      approverId
    });

    res.status(201).json(timesheet);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get timesheets (for employee or manager)
exports.getTimesheets = async (req, res) => {
  try {
    const { userId, approverId, status } = req.query;
    const filter = {};
    if (userId) filter.userId = userId;
    if (approverId) filter.approverId = approverId;
    if (status) filter.status = status;

    const timesheets = await Timesheet.find(filter)
      .populate('userId', 'name avatarUrl')
      .populate('timeLogs')
      .sort({ periodStartDate: -1 });

    res.json(timesheets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update status (Approve/Reject)
exports.updateTimesheetStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    const timesheet = await Timesheet.findByIdAndUpdate(
      id,
      { status, rejectionReason },
      { new: true }
    );

    res.json(timesheet);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
