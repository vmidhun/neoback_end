
const entitlementService = require('../services/entitlementService');
const db = require('../models');
const { TenantSubscription } = db;

exports.getMyEntitlements = async (req, res) => {
    try {
        const tenantId = req.user.tenantId; // From authContext
        if (!tenantId) return res.status(400).json({ error: 'Tenant context required' });

        const entitlements = await entitlementService.getTenantEntitlements(tenantId);
        
        // Also fetch basic plan info separately to display "Current Plan: Starter"
        const sub = await TenantSubscription.findOne({ tenant: tenantId }).populate('plan', 'name code billingType');
        
        res.json({
            plan: sub ? sub.plan : null,
            features: entitlements
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
