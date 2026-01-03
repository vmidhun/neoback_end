
const entitlementService = require('../services/entitlementService');
const db = require('../models');
const { TenantProductSubscription } = db;

exports.getMyEntitlements = async (req, res) => {
    try {
        const tenantId = req.user.tenantId; // From authContext
        if (!tenantId) return res.status(400).json({ error: 'Tenant context required' });

        const entitlements = await entitlementService.getTenantEntitlements(tenantId);
        
        // Also fetch basic plan info separately to display "Current Plan: Starter"
        // We assume 'p_base' or similar represents the main plan.
        const sub = await TenantProductSubscription.findOne({ tenantId: tenantId, productId: 'p_base' }).populate('productId', 'name code billingType');
        
        res.json({
            plan: sub ? sub.productId : null,
            features: entitlements
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
