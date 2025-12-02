
const db = require('../models');

// Clients
exports.getClients = async (req, res) => {
  const clients = await db.Client.findAll();
  res.json(clients);
};
exports.createClient = async (req, res) => {
    try {
      const newClient = await db.Client.create({ 
        id: `cli_${Date.now()}`, 
        ...req.body 
      });
      res.status(201).json(newClient);
    } catch(err) { res.status(500).json({error: err.message}); }
};
exports.updateClient = async (req, res) => {
    try {
      const [updated] = await db.Client.update(req.body, { where: { id: req.params.id }});
      if (!updated) return res.status(404).json({error: "Not found"});
      const client = await db.Client.findByPk(req.params.id);
      res.json(client);
    } catch(err) { res.status(500).json({error: err.message}); }
};
exports.deleteClient = async (req, res) => {
    try {
      await db.Client.destroy({ where: { id: req.params.id }});
      res.status(204).send();
    } catch(err) { res.status(500).json({error: err.message}); }
};

// Projects
exports.getProjects = async (req, res) => {
  const projects = await db.Project.findAll({ include: [db.Client] });
  res.json(projects);
};
exports.createProject = async (req, res) => {
    try {
      const newProject = await db.Project.create({ 
          id: `proj_${Date.now()}`, 
          name: req.body.name,
          clientId: req.body.clientId
      });
      const project = await db.Project.findByPk(newProject.id, { include: [db.Client] });
      res.status(201).json(project);
    } catch(err) { res.status(500).json({error: err.message}); }
};

// Jobs
exports.getJobs = async (req, res) => {
  const jobs = await db.Job.findAll();
  res.json(jobs);
};
exports.createJob = async (req, res) => {
    try {
      const newJob = await db.Job.create({ 
          id: `job_${Date.now()}`, 
          name: req.body.name, 
          projectId: req.body.projectId 
      });
      const job = await db.Job.findByPk(newJob.id, {
        include: [{ model: db.Project, include: [db.Client] }]
      });
      res.status(201).json(job);
    } catch(err) { res.status(500).json({error: err.message}); }
};


// Config
exports.getModules = async (req, res) => {
  const modules = await db.ModuleConfig.findAll();
  res.json(modules);
};
exports.updateModule = async (req, res) => {
    try {
      const mod = await db.ModuleConfig.findByPk(req.params.moduleName);
      if (!mod) return res.status(404).json({error: "Module not found"});
      mod.enabled = req.body.enabled;
      await mod.save();
      res.json(mod);
    } catch(err) { res.status(500).json({error: err.message}); }
};
