
const db = require('../models');
const { Product, ProductFeature, Tenant, TenantProductSubscription, TenantUsage } = db;
const entitlementService = require('../services/entitlementService');

// --- Products ---
exports.getProducts = async (req, res) => {
    try {
        const products = await Product.find().sort({ priceAmount: 1 });
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createProduct = async (req, res) => {
    try {
        const { id, name, code, description, billingType, priceCurrency, priceAmount, pricingTiers } = req.body;
        // Map 'id' from frontend to '_id' for Mongoose
        const newProduct = await Product.create({ _id: id, name, code, description, billingType, priceCurrency, priceAmount, pricingTiers });
        res.status(201).json(newProduct);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await Product.findByIdAndUpdate(id, req.body, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// --- Product Features ---
exports.getProductFeatures = async (req, res) => {
    try {
        const { productId } = req.params;
        const features = await ProductFeature.find({ product: productId });
        res.json(features);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.bulkUpdateFeatures = async (req, res) => {
    try {
        const { productId } = req.params;
        const featureList = req.body; // Array of { key, type, boolValue, numericValue }

        const results = [];
        for (const feat of featureList) {
            const f = await ProductFeature.findOneAndUpdate(
                { product: productId, key: feat.key },
                { ...feat, product: productId },
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
            const subs = await TenantProductSubscription.find({ tenantId: t._id }).populate('productId', 'name code');
            enhanced.push({
                ...t.toObject(),
                subscriptions: subs.map(s => {
                    if (!s.productId) return null;
                    return {
                        productId: s.productId._id,
                        productName: s.productId.name,
                        productCode: s.productId.code,
                        status: s.status
                    };
                }).filter(Boolean)
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

exports.getSubscriptions = async (req, res) => {
    try {
        const { tenantId } = req.params;
        const subs = await TenantProductSubscription.find({ tenantId: tenantId }).populate('productId');
        res.json(subs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateSubscription = async (req, res) => {
    try {
        const { tenantId } = req.params;
        const { productId, status, trialEnd, discountType, discountValue, billingTierIndex } = req.body;

        // We need productId to identify which subscription to update
        if (!productId) return res.status(400).json({ error: "productId is required" });

        const updateData = {
            status,
            trialEnd,
            discountType,
            discountValue,
            billingTierIndex
        };

        const sub = await TenantProductSubscription.findOneAndUpdate(
            { tenantId: tenantId, productId: productId },
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
        const subs = await TenantProductSubscription.find().populate('productId', 'code name');
        
        const byProduct = {};   // { productCode: count }
        const byStatus = {}; // { TRIAL: count, ACTIVE: count }
        
        subs.forEach(s => {
            const code = s.productId?.code || 'UNKNOWN';
            byProduct[code] = (byProduct[code] || 0) + 1;
            byStatus[s.status] = (byStatus[s.status] || 0) + 1;
        });

        res.json({
            totalTenants,
            activeTenants,
            byProduct,
            byStatus
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
