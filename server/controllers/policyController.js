const { LeaveType, WorkCalendar, Timesheet, Project } = require('../models');

// --- Leave Types ---
exports.getLeaveTypes = async (req, res) => {
  try {
    const types = await LeaveType.find();
    res.json(types);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createLeaveType = async (req, res) => {
  try {
    const { name, description, annualQuota, isPaid, color } = req.body;
    const _id = name.toLowerCase().replace(/ /g, '-');
    const newType = await LeaveType.create({ _id, name, description, annualQuota, isPaid, color });
    res.status(201).json(newType);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updateLeaveType = async (req, res) => {
  try {
    const updated = await LeaveType.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteLeaveType = async (req, res) => {
  try {
    await LeaveType.findByIdAndDelete(req.params.id);
    res.json({ message: 'Leave Type deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- Work Calendars ---
exports.getWorkCalendars = async (req, res) => {
  try {
    const calendars = await WorkCalendar.find().populate('holidayIds');
    res.json(calendars);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createWorkCalendar = async (req, res) => {
  try {
    const { name, workingDays, holidayIds, timezone } = req.body;
    const _id = 'cal_' + Date.now();
    const newCal = await WorkCalendar.create({ _id, name, workingDays, holidayIds, timezone });
    res.status(201).json(newCal);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updateWorkCalendar = async (req, res) => {
  try {
    const updated = await WorkCalendar.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteWorkCalendar = async (req, res) => {
  try {
    await WorkCalendar.findByIdAndDelete(req.params.id);
    res.json({ message: 'Work Calendar deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- Timesheet Config (Project Level) ---
exports.updateProjectTimesheetConfig = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { workCalendarId, timesheetConfig } = req.body;
    
    const updated = await Project.findByIdAndUpdate(
      projectId, 
      { workCalendarId, timesheetConfig },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
