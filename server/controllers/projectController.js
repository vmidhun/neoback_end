
const db = require('../models');

exports.getProjects = async (req, res) => {
  try {
    const projects = await db.Project.find().populate('clientId');
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ message: "Failed", details: error.message });
  }
};

exports.createProject = async (req, res) => {
  try {
    const { name, clientId } = req.body;
    const newProject = await db.Project.create({
      _id: `proj_${Date.now()}`,
      name,
      clientId
    });
    res.status(201).json(newProject);
  } catch (error) {
    res.status(500).json({ message: "Failed", details: error.message });
  }
};
