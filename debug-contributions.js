// Debug script to check contributions in database
const mongoose = require('mongoose');
require('dotenv').config();

const Contribution = require('./server/models/Contribution');

async function checkContributions() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const allContributions = await Contribution.find().sort({ submittedAt: -1 });

        console.log(`\n📊 Total contributions: ${allContributions.length}\n`);

        allContributions.forEach((contrib, index) => {
            console.log(`\n--- Contribution ${index + 1} ---`);
            console.log(`ID: ${contrib._id}`);
            console.log(`Type: ${contrib.type}`);
            console.log(`Title: ${contrib.title}`);
            console.log(`Status: ${contrib.status}`);
            console.log(`Submitted By:`, contrib.submittedBy);
            console.log(`Submitted At: ${contrib.submittedAt}`);
            if (contrib.type === 'book_upload') {
                console.log(`Book Data:`, contrib.data);
            }
        });

        await mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkContributions();
