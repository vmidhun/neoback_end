
const entitlementService = require('../services/entitlementService');
const { TenantUsage } = require('../models');

exports.ensureFeatureEnabled = (featureKey) => {
    return async (req, res, next) => {
        try {
            // Need tenantId. Assuming middleware/auth.js puts user on req.user and user has tenantId if scoped.
            // Or if strict tenant scoping middleware exists.
            let tenantId = req.headers['x-tenant-id'] || (req.user && req.user.tenantId);
            
            if (!tenantId) {
                 // If SuperAdmin, maybe bypass? Or enforced?
                 // Standard flow requires tenant context
                 return res.status(400).json({ error: 'Tenant context required' });
            }

            const entitlements = await entitlementService.getTenantEntitlements(tenantId);
            const feature = entitlements[featureKey];

            if (!feature || feature.type !== 'BOOLEAN' || !feature.value) {
                return res.status(403).json({
                    error: 'FEATURE_DISABLED',
                    message: `Feature '${featureKey}' is not included in your current plan.`
                });
            }
            
            next();
        } catch (err) {
            console.error("Entitlement check failed:", err);
            res.status(500).json({ error: "Entitlement check failed" });
        }
    };
};

exports.checkLimit = (featureKey, usageGetter) => {
    return async (req, res, next) => {
        try {
            let tenantId = req.headers['x-tenant-id'] || (req.user && req.user.tenantId);
            if (!tenantId) return res.status(400).json({ error: 'Tenant context required' });

            const entitlements = await entitlementService.getTenantEntitlements(tenantId);
            const feature = entitlements[featureKey];

            if (!feature || feature.type !== 'NUMERIC') return next(); // No limit defined, proceed? Or block? Usually proceed if limit not enforcing.

            const limit = feature.value;
            if (typeof limit !== 'number') return next();

            // execute getter
            // usageGetter might be a function that returns a Promise
            // OR if generic, we might need a distinct way. 
            // The requirement example used a wrapper function. 
            // For middleware reuse, let's assume usageGetter is a string referencing a built-in counter logic OR we implement specific middlewares for specific limits.
            
            // Re-reading spec: "Usage example when creating an employee... await checkLimitAndThrow..."
            // It suggests using a helper function inside the controller, NOT necessarily generic middleware, OR specific middleware.
            
            // I'll implement a reusable helper function here that can be called inside controllers, 
            // AND a generic middleware generator if needed.
            
            // For now, let's trust the spec's pattern: 'checkLimitAndThrow' helper.
            // But strict middleware is easier for routes.
            
            // Let's implement generic Usage Check logic if we pass a model name?
            // "async () => TenantUsage.findOne..."
            // Middleware can't easily accept a function unless generated at route def time.
            
            const currentUsage = await usageGetter(tenantId);
            
            if (currentUsage >= limit) {
                return res.status(403).json({
                    error: 'LIMIT_REACHED',
                    message: `You have reached the maximum limit (${limit}) for ${featureKey}.`,
                    currentUsage,
                    limit
                });
            }

            next();
        } catch (err) {
            next(err);
        }
    };
};
