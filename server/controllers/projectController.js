
exports.getProjects = async (req, res) => {
  try {
    // TODO: Fetch projects from DB
    res.status(200).json({ message: "List of projects placeholder" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createProject = async (req, res) => {
  try {
    // TODO: Create new project in DB
    const projectData = req.body;
    res.status(201).json({ message: "Project created placeholder", data: projectData });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
