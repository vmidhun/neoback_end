
const { users } = require('../data/store');

exports.login = (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  // In a real app, sign a real JWT here.
  // We return the User ID as the token for the mock middleware to consume.
  const mockToken = user.id; 

  res.status(200).json({
    token: mockToken, 
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl
    }
  });
};

exports.getMe = (req, res) => {
  const user = req.user;
  res.status(200).json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl,
    teamId: user.teamId
  });
};
