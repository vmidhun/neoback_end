const config = require('../config');
const db = require('../models');
const User = db.User;

// Middleware to verify authentication token
exports.verifyToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return res.status(401).json({ error: "Unauthorized: Missing token." });
  }

  const token = authHeader.split(' ')[1];
  
  // Simulation: We treat the token as the User ID directly for the nut shell demo.
  // In a real app, verify JWT here: jwt.verify(token, config.JWT_SECRET)
  
  try {
    let user = await User.findByPk(token);

    // Fallback for demo convenience: if token is long JWT string, default to emp_1
    if (!user && token.startsWith("eyJ")) {
       user = await User.findByPk("emp_1");
    }

    if (!user) {
      return res.status(401).json({ error: "Unauthorized: Invalid token." });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("Auth Error:", err);
    res.status(500).json({ error: "Internal Auth Error" });
  }
};

exports.authorize = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden: Insufficient permissions." });
    }
    next();
  };
};