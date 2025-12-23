
const db = require('../models');

// Clients
exports.getClients = async (req, res) => {
  const clients = await db.Client.find();
  res.json(clients);
};
exports.createClient = async (req, res) => {
    try {
      const newClient = await db.Client.create({ _id: `cli_${Date.now()}`, ...req.body });
      res.status(201).json(newClient);
    } catch(err) { res.status(500).json({error: err.message}); }
};
exports.updateClient = async (req, res) => {
    try {
      const client = await db.Client.findByIdAndUpdate(req.params.id, req.body, { new: true });
      res.json(client);
    } catch(err) { res.status(500).json({error: err.message}); }
};
exports.deleteClient = async (req, res) => {
    try {
      await db.Client.findByIdAndDelete(req.params.id);
      res.status(204).send();
    } catch(err) { res.status(500).json({error: err.message}); }
};

// Projects
exports.getProjects = async (req, res) => {
  const projects = await db.Project.find().populate('clientId');
  res.json(projects);
};
exports.createProject = async (req, res) => {
    try {
      const newProject = await db.Project.create({ 
          _id: `proj_${Date.now()}`, 
          name: req.body.name,
          clientId: req.body.clientId
      });
      res.status(201).json(newProject);
    } catch(err) { res.status(500).json({error: err.message}); }
};

// Jobs
exports.getJobs = async (req, res) => {
  const jobs = await db.Job.find();
  res.json(jobs);
};
exports.createJob = async (req, res) => {
    try {
      const newJob = await db.Job.create({ 
          _id: `job_${Date.now()}`, 
          name: req.body.name, 
          projectId: req.body.projectId 
      });
      res.status(201).json(newJob);
    } catch(err) { res.status(500).json({error: err.message}); }
};

// Config
exports.getModules = async (req, res) => {
  const modules = await db.ModuleConfig.find();
  res.json(modules.map(m => ({ name: m._id, enabled: m.enabled })));
};
exports.updateModule = async (req, res) => {
    try {
      const mod = await db.ModuleConfig.findById(req.params.moduleName);
      if (!mod) return res.status(404).json({error: "Module not found"});
      mod.enabled = req.body.enabled;
      await mod.save();
      res.json({ name: mod._id, enabled: mod.enabled });
    } catch(err) { res.status(500).json({error: err.message}); }
};
