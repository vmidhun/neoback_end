
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
