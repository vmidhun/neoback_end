
const db = require('../models');
const User = db.User;

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    const user = await User.findOne({ email, password });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    res.status(200).json({
      token: user._id, 
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMe = (req, res) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: "Not authenticated" });
  
  res.status(200).json({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl,
    teamId: user.teamId
  });
};
