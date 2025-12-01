
const store = require('../data/store');

// Generic CRUD handlers could be abstracted, but implementing explicitly for clarity
exports.getClients = (req, res) => res.json(store.clients);
exports.createClient = (req, res) => {
    const newClient = { id: `cli_${Date.now()}`, ...req.body };
    store.clients.push(newClient);
    res.status(201).json(newClient);
};
exports.updateClient = (req, res) => {
    const idx = store.clients.findIndex(c => c.id === req.params.id);
    if (idx === -1) return res.status(404).json({error: "Not found"});
    store.clients[idx] = { ...store.clients[idx], ...req.body };
    res.json(store.clients[idx]);
};
exports.deleteClient = (req, res) => {
    const idx = store.clients.findIndex(c => c.id === req.params.id);
    if (idx !== -1) store.clients.splice(idx, 1);
    res.status(204).send();
};

// Projects
exports.getProjects = (req, res) => res.json(store.projects);
exports.createProject = (req, res) => {
    const clientId = req.body.clientId;
    const client = store.clients.find(c => c.id === clientId);
    const newProject = { 
        id: `proj_${Date.now()}`, 
        name: req.body.name,
        clientId: clientId
    };
    store.projects.push(newProject);
    res.status(201).json({ ...newProject, client });
};
// Jobs
exports.getJobs = (req, res) => res.json(store.jobs);
exports.createJob = (req, res) => {
    const projectId = req.body.projectId;
    const project = store.projects.find(p => p.id === projectId);
    const newJob = { 
        id: `job_${Date.now()}`, 
        name: req.body.name, 
        projectId 
    };
    store.jobs.push(newJob);
    // Hydrate response for consistency with spec
    const client = project ? store.clients.find(c => c.id === project.clientId) : null;
    res.status(201).json({
        ...newJob,
        project: project ? { ...project, client } : null
    });
};


// Config
exports.getModules = (req, res) => res.json(store.modules);
exports.updateModule = (req, res) => {
    const mod = store.modules.find(m => m.name === req.params.moduleName);
    if (!mod) return res.status(404).json({error: "Module not found"});
    mod.enabled = req.body.enabled;
    res.json(mod);
};
