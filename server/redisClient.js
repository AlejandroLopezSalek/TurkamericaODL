const { createClient } = require('redis');

// Create a Redis client. By default, it connects to localhost:6379
const client = createClient({
    url: process.env.REDIS_URL || 'redis://127.0.0.1:6379'
});

// In development, Redis may not be running locally — suppress repeated error spam
let redisErrorLogged = false;
client.on('error', (err) => {
    // Only log errors in production or if it's the first time and we aren't handling it via try-catch
    if (!redisErrorLogged && process.env.NODE_ENV === 'production') {
        console.warn('[Redis] Connection error:', err.code || err.message);
        redisErrorLogged = true;
    }
});
client.on('connect', () => {
    redisErrorLogged = false; // Reset if it reconnects
    console.log('✅ Connected to Redis successfully.');
});

// Self-invoking function to connect the client
(async () => {
    try {
        await client.connect();
    } catch (e) {
        if (process.env.NODE_ENV !== 'production' && !redisErrorLogged) {
            console.log('ℹ️ [Redis] Local caching disabled (Redis not found). Using MongoDB fallback.');
            redisErrorLogged = true;
        }
    }
})();

module.exports = client;
