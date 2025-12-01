
const { users } = require('../data/store');

exports.getAllUsers = (req, res) => {
  // Return safe user objects (no passwords)
  const safeUsers = users.map(({ password, ...u }) => u);
  res.status(200).json(safeUsers);
};

exports.getUserById = (req, res) => {
  const { id } = req.params;
  const user = users.find(u => u.id === id);

  if (!user) {
    return res.status(404).json({ error: "User not found." });
  }

  // Role based access check logic could go here (e.g. can emp_1 see emp_2?)
  // Assuming authorized via middleware for now.

  const { password, ...safeUser } = user;
  res.status(200).json(safeUser);
};
