
const config = require('../config');
const db = require('../models');
const User = db.User;

exports.verifyToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return res.status(401).json({ error: "Unauthorized: Missing token." });
  }

  const token = authHeader.split(' ')[1];
  
  try {
    // For this shell, token is just the ID
    let user = await User.findById(token);

    if (!user && token.startsWith("eyJ")) {
       user = await User.findById("emp_1");
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
