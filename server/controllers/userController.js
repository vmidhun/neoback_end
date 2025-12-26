
const db = require('../models');
const User = db.User;

exports.getAllUsers = async (req, res) => {
  try {
    const query = {};
    // If not SuperAdmin, restrict to tenant
    if (req.user && req.user.role !== 'SuperAdmin') {
      if (!req.user.tenantId) {
        return res.status(400).json({ error: "Tenant context missing for user." });
      }
      query.tenantId = req.user.tenantId;
    } else {
      // If SuperAdmin, maybe we shouldn't be calling this endpoint for general user lists?
      // Or if we do, we might want a specific tenant ID passed in query?
      // For now, let's leave it open for SuperAdmin or restrict if no tenantId provided?
      // Let's safe default to empty to allow SA to see all, OR filtered if query provided.
    }

    // Explicitly exclude SuperAdmins from the list if requested by a normal user
    if (req.user && req.user.role !== 'SuperAdmin') {
      query.role = { $ne: 'SuperAdmin' };
    }

    const users = await User.find(query, '-password');
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id, '-password');

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const newUser = await User.create({
      _id: `emp_${Date.now()}`,
      ...req.body
    });
    res.status(201).json(newUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.bulkUpdateUsers = async (req, res) => {
  try {
    const { userIds, updates } = req.body;
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: "No user IDs provided" });
    }

    // We can use updateMany if the update is identical for all users.
    // req.body.updates is expected to be the object to set, e.g., { teamId: "..." }

    const result = await User.updateMany(
      { _id: { $in: userIds } },
      { $set: updates }
    );

    res.json({ message: "Users updated", modifiedCount: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
