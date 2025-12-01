
const config = require('../config');
const { users } = require('../data/store');

// Middleware to verify authentication token (Mock Implementation for simulation)
exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return res.status(401).json({ error: "Unauthorized: Missing token." });
  }

  const token = authHeader.split(' ')[1];
  
  // In a real app, verify JWT signature here.
  // For this mock, we assume the token is base64 encoded "userId:secret"
  // OR for simplicity in testing, we accept just the userID as the token or a dummy string that maps to a user.
  
  // Simulation: We will treat the token as the User ID directly for ease of testing the "nut shell".
  // If token is "eyJ...", we'll assume it's valid for "emp_1" if it's the hardcoded demo token, 
  // otherwise we try to look up a user by ID if the token matches an ID.
  
  let user = users.find(u => u.id === token);
  
  // Fallback for demo: if token is the hardcoded JWT string from doc, use emp_1
  if (!user && token.startsWith("eyJ")) {
      user = users.find(u => u.id === "emp_1");
  }

  if (!user) {
    // If not found, check if it's a "login" token simulation
    // Allowing loose auth for demo purposes
    return res.status(401).json({ error: "Unauthorized: Invalid token." });
  }

  req.user = user;
  next();
};

exports.authorize = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden: Insufficient permissions." });
    }
    next();
  };
};
