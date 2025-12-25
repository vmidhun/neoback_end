
const { LeaveType, ModuleConfig } = require('../models');

// --- Leave Types ---
exports.getLeaveTypes = async (req, res) => {
  try {
    const types = await LeaveType.find();
    res.json(types);
  } catch (err) {
      res.status(500).json({ message: "Error fetching leave types" });
    }
};

exports.createLeaveType = async (req, res) => {
  try {
      const { name, description, annualQuota, isPaid, color, accrualRate, maxContinuousDays, encashmentAllowed } = req.body;

      // Simple slug generation
      const _id = name.toLowerCase().replace(/\s+/g, '-');

      const newType = new LeaveType({
        _id,
        name,
        description,
        annualQuota,
        isPaid,
        color,
        accrualRate,
        maxContinuousDays,
        encashmentAllowed
      });

      await newType.save();
      res.status(201).json(newType);
    } catch (err) {
      res.status(500).json({ message: "Error creating leave type" });
    }
};

exports.updateLeaveType = async (req, res) => {
  try {
      const { id } = req.params;
      const updates = req.body;
      const type = await LeaveType.findByIdAndUpdate(id, updates, { new: true });
      res.json(type);
    } catch (err) {
      res.status(500).json({ message: "Error updating leave type" });
    }
};

exports.deleteLeaveType = async (req, res) => {
  try {
      const { id } = req.params;
      await LeaveType.findByIdAndDelete(id);
      res.json({ message: "Leave type deleted" });
    } catch (err) {
      res.status(500).json({ message: "Error deleting leave type" });
    }
};

// --- Module Configs ---
exports.getDataRetention = async (req, res) => {
  // Mock response for now, as Schema doesn't have retention fields yet
  res.json({ retentionYears: 7 });
};

exports.updateDataRetention = async (req, res) => {
  res.json({ message: "Updated" });
};
