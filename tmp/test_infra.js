const mongoose = require('mongoose');
const { createClient } = require('redis');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/turkamerica';
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

async function test() {
    console.log('Testing MongoDB connection to:', MONGO_URI);
    try {
        await mongoose.connect(MONGO_URI);
        console.log('MongoDB: Connected.');

        const DailyWord = mongoose.models.DailyWord || mongoose.model('DailyWord', new mongoose.Schema({ date: String, data: Object }, { collection: 'daily_words' }));
        console.log('MongoDB: Querying DailyWord...');
        const doc = await DailyWord.findOne({}).maxTimeMS(5000);
        console.log('MongoDB: Query result:', doc ? 'Found' : 'Not found');
    } catch (e) {
        console.error('MongoDB Error:', e.message);
    }

    console.log('\nTesting Redis connection to:', REDIS_URL);
    const client = createClient({ url: REDIS_URL, socket: { connectTimeout: 5000 } });
    client.on('error', (err) => console.log('Redis error during test:', err.message));
    try {
        await client.connect();
        console.log('Redis: Connected.');
        const val = await client.get('test_key');
        console.log('Redis: Get check done.');
        await client.disconnect();
    } catch (e) {
        console.error('Redis Error:', e.message);
    }

    process.exit(0);
}

test();
