
const mongoose = require('mongoose');
const config = require('./config');
const { User } = require('./models');

const checkUsers = async () => {
    try {
        await mongoose.connect(config.MONGODB_URI, {
            dbName: config.DB.NAME
        });
        console.log('Connected to MongoDB');

        const users = await User.find({}, '_id name email role tenantId');
        console.log('All Users:', JSON.stringify(users, null, 2));
        
        process.exit(0);
    } catch (err) {
        console.error('Check failed:', err);
        process.exit(1);
    }
};

checkUsers();
