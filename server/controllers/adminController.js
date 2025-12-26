
const db = require('../models');

// Clients
exports.getClients = async (req, res) => {
  const query = req.user.role === 'SuperAdmin' ? {} : { tenantId: req.user.tenantId };
  const clients = await db.Client.find(query);
  res.json(clients);
};
exports.createClient = async (req, res) => {
    try {
      if (!req.user.tenantId && req.user.role !== 'SuperAdmin') return res.status(400).json({ error: "Tenant context missing" });
      const newClient = await db.Client.create({
        _id: `cli_${Date.now()}`,
        tenantId: req.user.tenantId,
        ...req.body
      });
      res.status(201).json(newClient);
    } catch(err) { res.status(500).json({error: err.message}); }
};
exports.updateClient = async (req, res) => {
    try {
      // Ensure tenant ownership
      const client = await db.Client.findOne({ _id: req.params.id, tenantId: req.user.tenantId });
      if (!client) return res.status(404).json({ error: "Client not found" });
      Object.assign(client, req.body);
      await client.save();
      res.json(client);
    } catch(err) { res.status(500).json({error: err.message}); }
};
exports.deleteClient = async (req, res) => {
    try {
      const client = await db.Client.findOneAndDelete({ _id: req.params.id, tenantId: req.user.tenantId });
      if (!client) return res.status(404).json({ error: "Client not found" });
      res.status(204).send();
    } catch(err) { res.status(500).json({error: err.message}); }
};

// Projects
exports.getProjects = async (req, res) => {
  const query = req.user.role === 'SuperAdmin' ? {} : { tenantId: req.user.tenantId };
  const projects = await db.Project.find(query).populate('clientId');
  res.json(projects);
};
exports.createProject = async (req, res) => {
    try {
      if (!req.user.tenantId) return res.status(400).json({ error: "Tenant context missing" });
      const newProject = await db.Project.create({ 
          _id: `proj_${Date.now()}`, 
        tenantId: req.user.tenantId,
          name: req.body.name,
          clientId: req.body.clientId
      });
      res.status(201).json(newProject);
    } catch(err) { res.status(500).json({error: err.message}); }
};
exports.updateProject = async (req, res) => {
  try {
    const project = await db.Project.findOne({ _id: req.params.id, tenantId: req.user.tenantId });
    if (!project) return res.status(404).json({ error: "Project not found" });
    Object.assign(project, req.body);
    await project.save();
    res.json(project);
  } catch (err) { res.status(500).json({ error: err.message }); }
};
exports.deleteProject = async (req, res) => {
  try {
    await db.Project.findOneAndDelete({ _id: req.params.id, tenantId: req.user.tenantId });
    res.status(204).send();
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// Jobs
exports.getJobs = async (req, res) => {
  const query = req.user.role === 'SuperAdmin' ? {} : { tenantId: req.user.tenantId };
  const jobs = await db.Job.find(query);
  res.json(jobs);
};
exports.createJob = async (req, res) => {
    try {
      if (!req.user.tenantId) return res.status(400).json({ error: "Tenant context missing" });
      const newJob = await db.Job.create({ 
          _id: `job_${Date.now()}`, 
        tenantId: req.user.tenantId,
          name: req.body.name, 
          projectId: req.body.projectId 
      });
      res.status(201).json(newJob);
    } catch(err) { res.status(500).json({error: err.message}); }
};

// Config
exports.getModules = async (req, res) => {
  try {
  // If we are strictly multi-tenant, this might need to return tenant settings or global defaults.
  // For now, returning global config to satisfy route requirements.
    const modules = await db.ModuleConfig.find();
    res.json(modules.map(m => ({ name: m._id, enabled: m.enabled })));
  } catch (err) { res.status(500).json({ error: err.message }); }
};
exports.updateModule = async (req, res) => {
    try {
      // Logic for global module update (likely Admin/SuperAdmin only)
      const mod = await db.ModuleConfig.findById(req.params.moduleName);
      if (!mod) return res.status(404).json({error: "Module not found"});
      mod.enabled = req.body.enabled;
      await mod.save();
      res.json({ name: mod._id, enabled: mod.enabled });
    } catch(err) { res.status(500).json({error: err.message}); }
};

// Teams
exports.getTeams = async (req, res) => {
  const query = req.user.role === 'SuperAdmin' ? {} : { tenantId: req.user.tenantId };
  const teams = await db.Team.find(query);
  res.json(teams);
};
exports.createTeam = async (req, res) => {
  try {
    if (!req.user.tenantId) return res.status(400).json({ error: "Tenant context missing" });
    const newTeam = await db.Team.create({
      _id: `team_${Date.now()}`,
      tenantId: req.user.tenantId,
      ...req.body
    });
    res.status(201).json(newTeam);
  } catch (err) { res.status(500).json({ error: err.message }); }
};
exports.updateTeam = async (req, res) => {
  try {
    const team = await db.Team.findOneAndUpdate({ _id: req.params.id, tenantId: req.user.tenantId }, req.body, { new: true });
    if (!team) return res.status(404).json({ error: "Team not found" });
    res.json(team);
  } catch (err) { res.status(500).json({ error: err.message }); }
};
exports.deleteTeam = async (req, res) => {
  try {
    await db.Team.findOneAndDelete({ _id: req.params.id, tenantId: req.user.tenantId });
    res.status(204).send();
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// Tasks (Admin Overrides)
exports.createTask = async (req, res) => {
  try {
    if (!req.user.tenantId) return res.status(400).json({ error: "Tenant context missing" });
    const newTask = await db.Task.create({
      _id: `task_${Date.now()}`,
      tenantId: req.user.tenantId,
      ...req.body
    });
    res.status(201).json(newTask);
  } catch (err) { res.status(500).json({ error: err.message }); }
};
exports.updateTask = async (req, res) => {
  try {
    const task = await db.Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(task);
  } catch (err) { res.status(500).json({ error: err.message }); }
};
exports.deleteTask = async (req, res) => {
  try {
    await db.Task.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (err) { res.status(500).json({ error: err.message }); }
};
