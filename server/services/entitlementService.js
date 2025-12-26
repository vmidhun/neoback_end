
const db = require('../models');
const { TenantSubscription, PlanFeature } = db;

// In-memory cache for entitlements with short TTL
// Structure: { tenantId: { entitlements: {...}, expiresAt: timestamp } }
const cache = {};
const TTL_MS = 5 * 60 * 1000; // 5 minutes

exports.getTenantEntitlements = async (tenantId) => {
    // 1. Check cache
    const now = Date.now();
    if (cache[tenantId] && cache[tenantId].expiresAt > now) {
        return cache[tenantId].entitlements;
    }

    // 2. Fetch from DB
    // Get active subscription
    const subscription = await TenantSubscription.findOne({ 
        tenant: tenantId, 
        status: { $in: ['TRIAL', 'ACTIVE'] } // Only active/trial get features? or allow PAST_DUE with limits?
    });

    // Default entitlements (everything disabled/0)
    let entitlements = {
        project_management: { type: 'BOOLEAN', value: false },
        leave_management: { type: 'BOOLEAN', value: false },
        timesheet: { type: 'BOOLEAN', value: false },
        team_standup: { type: 'BOOLEAN', value: false },
        reports: { type: 'BOOLEAN', value: false },
        max_employees: { type: 'NUMERIC', value: 0 },
        max_projects: { type: 'NUMERIC', value: 0 }
    };

    if (subscription && subscription.plan) {
        const features = await PlanFeature.find({ plan: subscription.plan });
        
        features.forEach(f => {
            if (f.type === 'BOOLEAN') {
                entitlements[f.key] = { type: 'BOOLEAN', value: f.boolValue, planAllowed: f.boolValue };
            } else if (f.type === 'NUMERIC') {
                entitlements[f.key] = { type: 'NUMERIC', value: f.numericValue, planAllowed: true }; // Numeric usually limits, true means 'feature present'
            }
        });
    }

    // Apply Tenant Overrides (Disable only)
    const tenant = await db.Tenant.findById(tenantId).select('settings');
    if (tenant && tenant.settings && tenant.settings.disabledModules) {
        tenant.settings.disabledModules.forEach(key => {
            if (entitlements[key] && entitlements[key].type === 'BOOLEAN') {
                entitlements[key].value = false;
            }
        });
    }

    // 3. Update cache
    cache[tenantId] = {
        entitlements,
        expiresAt: now + TTL_MS
    };

    return entitlements;
};

// Helper to invalidate cache when plan changes
exports.invalidateCache = (tenantId) => {
    delete cache[tenantId];
};
