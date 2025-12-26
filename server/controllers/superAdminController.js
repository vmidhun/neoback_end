
const db = require('../models');
const { Plan, PlanFeature, Tenant, TenantSubscription, TenantUsage } = db;
const entitlementService = require('../services/entitlementService');

// --- Plans ---
exports.getPlans = async (req, res) => {
    try {
        const plans = await Plan.find().sort({ priceAmount: 1 });
        // Retrieve features for each plan? Or separate call?
        // Let's include basic count or logic if needed. 
        res.json(plans);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createPlan = async (req, res) => {
    try {
        const { name, code, billingType, priceCurrency, priceAmount } = req.body;
        const newPlan = await Plan.create({ name, code, billingType, priceCurrency, priceAmount });
        res.status(201).json(newPlan);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updatePlan = async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await Plan.findByIdAndUpdate(id, req.body, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// --- Plan Features ---
exports.getPlanFeatures = async (req, res) => {
    try {
        const { planId } = req.params;
        const features = await PlanFeature.find({ plan: planId });
        res.json(features);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.bulkUpdateFeatures = async (req, res) => {
    try {
        const { planId } = req.params;
        const featureList = req.body; // Array of { key, type, boolValue, numericValue }
        
        // Transaction style or just loops? Loop is fine for now.
        const results = [];
        for (const feat of featureList) {
            const f = await PlanFeature.findOneAndUpdate(
                { plan: planId, key: feat.key },
                { ...feat, plan: planId },
                { upsert: true, new: true }
            );
            results.push(f);
        }
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// --- Tenant Management ---
exports.getTenants = async (req, res) => {
    try {
        const tenants = await Tenant.find();
        // Enrich with subscription info
        const enhanced = [];
        for (const t of tenants) {
            const sub = await TenantSubscription.findOne({ tenant: t._id }).populate('plan', 'name code');
            enhanced.push({
                ...t.toObject(),
                subscription: sub ? { status: sub.status, plan: sub.plan } : null
            });
        }
        res.json(enhanced);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateTenantStatus = async (req, res) => {
    try {
        const { tenantId } = req.params;
        const { status } = req.body; // Active, Suspended
        const tenant = await Tenant.findByIdAndUpdate(tenantId, { status }, { new: true });
        res.json(tenant);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getSubscription = async (req, res) => {
    try {
        const { tenantId } = req.params;
        const sub = await TenantSubscription.findOne({ tenant: tenantId }).populate('plan');
        res.json(sub || {});
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateSubscription = async (req, res) => {
    try {
        const { tenantId } = req.params;
        const { planId, status, trialEnd, discountType, discountValue } = req.body;
        
        const updateData = {
            plan: planId,
            status,
            trialEnd,
            discountType,
            discountValue
        };

        const sub = await TenantSubscription.findOneAndUpdate(
            { tenant: tenantId },
            updateData,
            { upsert: true, new: true }
        );
        
        // Invalidate cache
        entitlementService.invalidateCache(tenantId);
        
        res.json(sub);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// --- Metrics ---
exports.getMetrics = async (req, res) => {
    try {
        const totalTenants = await Tenant.countDocuments();
        const activeTenants = await Tenant.countDocuments({ status: 'Active' });
        // Subscription metrics
        const subs = await TenantSubscription.find().populate('plan', 'code name');
        
        const byPlan = {};   // { planCode: count }
        const byStatus = {}; // { TRIAL: count, ACTIVE: count }
        
        subs.forEach(s => {
            const code = s.plan?.code || 'UNKNOWN';
            byPlan[code] = (byPlan[code] || 0) + 1;
            byStatus[s.status] = (byStatus[s.status] || 0) + 1;
        });

        res.json({
            totalTenants,
            activeTenants,
            byPlan,
            byStatus
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
