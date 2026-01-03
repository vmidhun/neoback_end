
const db = require('../models');

const { TenantProductSubscription, ProductFeature } = db;

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
    // Get all active subscriptions
    const subscriptions = await TenantProductSubscription.find({
        tenantId: tenantId,
        status: { $in: ['TRIAL', 'ACTIVE'] } 
    });

    // Default entitlements (base capabilities if any default)
    let entitlements = {
        // We can initialize with false/0, or rely on products to set them.
        // For safety, nice to have known keys present.
    };

    // Collect Product IDs
    const productIds = subscriptions.map(sub => sub.productId);

    if (productIds.length > 0) {
        const features = await ProductFeature.find({ product: { $in: productIds } });
        
        features.forEach(f => {
            // Logic: enable if ANY product has it enabled (OR logic for boolean).
            // For Numeric: Max or Sum? Let's take MAX for now, or just overwrite.
            // Assuming simplified non-conflicting keys model as per spec.

            if (f.type === 'BOOLEAN') {
                // If already exists and is true, keep it true. Else set to current val.
                const current = entitlements[f.key];
                const newVal = f.boolValue;
                entitlements[f.key] = {
                    type: 'BOOLEAN',
                    value: (current && current.value) || newVal,
                    planAllowed: true
                };
            } else if (f.type === 'NUMERIC') {
                const current = entitlements[f.key];
                const newVal = f.numericValue;
                // Take the maximum limit found across products
                entitlements[f.key] = {
                    type: 'NUMERIC',
                    value: Math.max((current ? current.value : 0), newVal),
                    planAllowed: true
                };
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
