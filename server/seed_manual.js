const { connectDB, seed } = require('./models');

(async () => {
    try {
        await connectDB();
        console.log("Connected to DB, starting seed...");
        await seed(true);
        console.log("Seeding complete.");
        process.exit(0);
    } catch (err) {
        console.error("Seeding failed:", err);
        process.exit(1);
    }
})();
