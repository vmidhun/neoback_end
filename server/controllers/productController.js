const db = require('../models');
const { Product, ProductFeature } = db;

// Get all active products
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({ isActive: true }).sort({ priceAmount: 1 });
    
    // Optionally fetch features for each product
    const productsWithFeatures = [];
    for (const p of products) {
      const features = await ProductFeature.find({ product: p._id }).select('key type boolValue numericValue -_id');
      productsWithFeatures.push({
        ...p.toObject(),
        features
      });
    }

    res.json(productsWithFeatures);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
