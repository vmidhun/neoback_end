const fs = require('fs');
const path = require('path');

const seedDir = path.join(__dirname, 'seed_data');
const usersPath = path.join(seedDir, 'users_seed.json');
const teamDir = path.join(__dirname, '../public/team');

if (!fs.existsSync(usersPath)) {
    console.error("users_seed.json not found");
    process.exit(1);
}

const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
let updatedCount = 0;

if (fs.existsSync(teamDir)) {
    const files = fs.readdirSync(teamDir);
    
    users.forEach(user => {
        // Look for image file matching user._id
        // We match basic extensions
        const extensions = ['.jpeg', '.jpg', '.png', '.webp'];
        let foundFile = null;

        for (const ext of extensions) {
            const candidate = `${user._id}${ext}`;
            if (files.includes(candidate)) {
                foundFile = candidate;
                break;
            }
        }

        if (foundFile) {
            const newUrl = `/team/${foundFile}`;
            if (user.avatarUrl !== newUrl) {
                console.log(`Updating avatar for ${user.name} (${user._id}) to ${newUrl}`);
                user.avatarUrl = newUrl;
                updatedCount++;
            }
        }
    });
} else {
    console.log("Team directory not found:", teamDir);
}

if (updatedCount > 0) {
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
    console.log(`Updated ${updatedCount} user avatars.`);
} else {
    console.log("No avatar updates needed.");
}
