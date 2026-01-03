
const mongoose = require('mongoose');
const config = require('./config');
const { Tenant } = require('./models');

const checkTenants = async () => {
    try {
        await mongoose.connect(config.MONGODB_URI, {
            dbName: config.DB.NAME
        });
        console.log('Connected to MongoDB');

        const tenants = await Tenant.find({});
        console.log('All Tenants:', JSON.stringify(tenants, null, 2));
        
        process.exit(0);
    } catch (err) {
        console.error('Check failed:', err);
        process.exit(1);
    }
};

checkTenants();
