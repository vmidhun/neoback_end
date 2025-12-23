
const db = require('../models');

exports.getProjects = async (req, res) => {
  try {
    const projects = await db.Project.findAll({
      include: [db.Client]
    });
    res.status(200).json(projects);
  } catch (error) {
    console.error("Get Projects Error:", error);
    res.status(500).json({ 
      message: "Failed to retrieve projects.", 
      details: error.message 
    });
  }
};

exports.createProject = async (req, res) => {
  try {
    const { name, clientId } = req.body;

    // Basic validation
    if (!name || !clientId) {
      return res.status(400).json({ message: "Name and Client ID are required." });
    }

    const newProject = await db.Project.create({
      id: `proj_${Date.now()}`,
      name,
      clientId
    });

    res.status(201).json({ 
      message: "Project created successfully", 
      data: newProject 
    });
  } catch (error) {
    console.error("Create Project Error:", error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ 
        message: "Validation Error", 
        details: error.errors.map(e => e.message) 
      });
    }

    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({ 
        message: "Invalid Client ID provided." 
      });
    }

    res.status(500).json({ 
      message: "Internal Server Error", 
      details: error.message 
    });
  }
};
