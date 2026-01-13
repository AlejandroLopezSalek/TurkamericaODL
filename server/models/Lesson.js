const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
    id: String, // Use custom ID or MongoDB _id, but keeping 'id' for compatibility
    title: {
        type: String,
        required: true
    },
    level: String,
    author: String,
    description: String,
    content: String,
    publishedAt: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        default: 'published'
    }
});

module.exports = mongoose.model('Lesson', lessonSchema);
