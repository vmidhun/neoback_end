
const { Tenant } = require('../models');

exports.getTenants = async (req, res) => {
    try {
        const tenants = await Tenant.find();
        res.json(tenants);
    } catch (err) {
        res.status(500).json({ message: "Error fetching tenants" });
    }
};

exports.createTenant = async (req, res) => {
    try {
        const { name, domain, subscriptionPlan } = req.body;
        
        const newTenant = new Tenant({
            _id: `tenant_${Date.now()}`,
            name,
            domain,
            subscriptionPlan
        });
        
        await newTenant.save();
        res.status(201).json(newTenant);
    } catch (err) {
        res.status(500).json({ message: "Error creating tenant", error: err.message });
    }
};

exports.updateTenant = async (req, res) => {
    try {
        const { id } = req.params;
        const tenant = await Tenant.findByIdAndUpdate(id, req.body, { new: true });
        res.json(tenant);
    } catch (err) {
        res.status(500).json({ message: "Error updating tenant" });
    }
};

exports.deleteTenant = async (req, res) => {
    try {
        const { id } = req.params;
        await Tenant.findByIdAndDelete(id);
        res.json({ message: "Tenant deleted" });
    } catch (err) {
        res.status(500).json({ message: "Error deleting tenant" });
    }
};

exports.getSettings = async (req, res) => {
    try {
        if (!req.user || !req.user.tenantId) return res.status(400).json({ error: "Tenant context missing" });
        const tenant = await Tenant.findById(req.user.tenantId).select('settings');
        if (!tenant) return res.status(404).json({ error: "Tenant not found" });
        res.json(tenant.settings || {});
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updateSettings = async (req, res) => {
    try {
        if (!req.user || !req.user.tenantId) return res.status(400).json({ error: "Tenant context missing" });

        // Using $set to update fields within settings without overwriting entire object if partial update
        // For now, let's assume the FE sends the whole settings object or we merge.
        // safe merge:
        const update = {};
        if (req.body.disabledModules) update['settings.disabledModules'] = req.body.disabledModules;
        if (req.body.timezone) update['settings.timezone'] = req.body.timezone;
        if (req.body.workingHours) update['settings.workingHours'] = req.body.workingHours;

        const tenant = await Tenant.findByIdAndUpdate(
            req.user.tenantId,
            { $set: update },
            { new: true }
        ).select('settings');

        // Invalidate cache
        const entitlementService = require('../services/entitlementService');
        entitlementService.invalidateCache(req.user.tenantId);

        res.json(tenant.settings);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getPermissions = async (req, res) => {
    try {
        if (!req.user || !req.user.tenantId) return res.status(400).json({ error: "Tenant context missing" });
        const tenant = await Tenant.findById(req.user.tenantId).select('customPermissions');
        // If no custom permissions set, we might return defaults or empty object
        // The FE can merge with its own defaults if empty.
        res.json(tenant.customPermissions || {});
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updatePermissions = async (req, res) => {
    try {
        if (!req.user || !req.user.tenantId) return res.status(400).json({ error: "Tenant context missing" });

        // Body expected: { "Manager": { "projects": ["view", "edit"] }, ... }
        // We replace the entire map or merge? Replacing for a role is safer.
        // Let's assume the body IS the map of permissions for one or more roles.

        const update = { customPermissions: req.body };

        const tenant = await Tenant.findByIdAndUpdate(
            req.user.tenantId,
            { $set: update },
            { new: true, upsert: false }
        ).select('customPermissions');

        res.json(tenant.customPermissions);
    } catch (err) { res.status(500).json({ error: err.message }); }
};
