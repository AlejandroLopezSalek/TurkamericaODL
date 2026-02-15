const express = require('express');
const router = express.Router();
const Lesson = require('../models/Lesson');
const LessonHistory = require('../models/LessonHistory');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

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

// GET single lesson by ID
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

// DELETE lesson (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
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

// GET lesson history (Admin only)
router.get('/:id/history', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const history = await LessonHistory.find({ lessonId: req.params.id })
            .sort({ version: -1 });
        res.json(history);
    } catch (error) {
        console.error('Error fetching lesson history:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST restore lesson version (Admin only)
router.post('/:id/restore/:version', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id, version } = req.params;

        // Get historical version
        const history = await LessonHistory.findOne({
            lessonId: id,
            version: Number.parseInt(version, 10)
        });

        if (!history) {
            return res.status(404).json({ error: 'Version not found' });
        }

        // Get current lesson to save to history
        const currentLesson = await Lesson.findOne({ id });

        if (!currentLesson) {
            return res.status(404).json({ error: 'Current lesson not found' });
        }

        // Save current version to history before restoring
        await new LessonHistory({
            lessonId: currentLesson.id,
            version: currentLesson.version || 1,
            title: currentLesson.title,
            content: currentLesson.content,
            description: currentLesson.description,
            level: currentLesson.level,
            author: currentLesson.author,
            editedBy: req.user?.username || 'Admin',
            editedAt: currentLesson.editedAt || currentLesson.publishedAt
        }).save();

        // Restore old version
        await Lesson.findOneAndUpdate(
            { id },
            {
                title: history.title,
                content: history.content,
                description: history.description,
                editedAt: new Date(),
                version: (currentLesson.version || 1) + 1
            }
        );

        res.json({ success: true, message: 'Version restored successfully' });
    } catch (error) {
        console.error('Error restoring lesson version:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
