const express = require('express');
const router = express.Router();
const Lesson = require('../models/Lesson');

// GET all published lessons
router.get('/', async (req, res) => {
    try {
        const lessons = await Lesson.find({ status: 'published' }).sort({ publishedAt: -1 });
        res.json(lessons);
    } catch (error) {
        console.error('Error fetching lessons:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET single lesson
router.get('/:id', async (req, res) => {
    try {
        const lesson = await Lesson.findOne({ id: req.params.id });
        if (!lesson) {
            return res.status(404).json({ error: 'Lesson not found' });
        }
        res.json(lesson);
    } catch (error) {
        console.error('Error fetching lesson:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// DELETE lesson
router.delete('/:id', async (req, res) => {
    try {
        const result = await Lesson.findOneAndDelete({ id: req.params.id });
        if (!result) {
            return res.status(404).json({ error: 'Lesson not found' });
        }
        res.json({ success: true, message: 'Lesson deleted' });
    } catch (error) {
        console.error('Error deleting lesson:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
