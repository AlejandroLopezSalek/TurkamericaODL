// Debug script to check contributions in database
const mongoose = require('mongoose');
require('dotenv').config();

const Contribution = require('./server/models/Contribution');

// Main execution
async function runScript() { // Wrap in an async function to use await at top level
    try {
        console.log('🔍 Checking contributions...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to DB');

        const contributions = await Contribution.find({});
        console.log(`Found ${contributions.length} contributions:`);

        contributions.forEach(c => {
            console.log(`\nTitle: ${c.title}`);
            console.log(`Type: ${c.type}`);
            console.log(`SubmittedBy:`, c.submittedBy);
            console.log(`Data:`, c.data ? c.data.level : 'No data');
        });

        await mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkContributions();
