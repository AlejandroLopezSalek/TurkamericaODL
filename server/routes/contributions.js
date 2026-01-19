const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Contribution = require('../models/Contribution');
const Lesson = require('../models/Lesson');

const { authenticateToken, requireAdmin } = require('../middleware/auth');

// GET all requests
router.get('/', async (req, res) => {
    try {
        const contributions = await Contribution.find().sort({ submittedAt: -1 });
        res.json(contributions);
    } catch (error) {
        console.error('Error fetching contributions:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET pending requests (Admin only)
router.get('/pending', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const contributions = await Contribution.find({ status: 'pending' }).sort({ submittedAt: -1 });
        res.json(contributions);
    } catch (error) {
        console.error('Error fetching pending contributions:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST new request
router.post('/', async (req, res) => {
    try {
        const newContribution = new Contribution(req.body);
        const savedContribution = await newContribution.save();
        res.status(201).json(savedContribution);
    } catch (error) {
        console.error('Error creating contribution:', error);
        res.status(400).json({ error: 'Invalid data' });
    }
});

// DELETE request (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: 'Invalid ID format' });
        }

        const result = await Contribution.findByIdAndDelete(req.params.id);

        if (!result) {
            return res.status(404).json({ error: 'Contribution not found' });
        }
        res.json({ success: true, message: 'Contribution deleted' });
    } catch (error) {
        console.error('Error deleting contribution:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT update status (Approve/Reject) (Admin only)
router.put('/:id/status', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        if (!['approved', 'rejected', 'pending'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: 'Invalid ID format' });
        }

        const contribution = await Contribution.findByIdAndUpdate(
            req.params.id,
            {
                status: status,
                processedAt: new Date()
            },
            { new: true }
        );

        if (!contribution) {
            return res.status(404).json({ error: 'Contribution not found' });
        }

        // AUTO-PUBLISH LESSON IF APPROVED
        if (status === 'approved' && contribution.type === 'lesson_edit') {
            const lessonData = {
                id: contribution.data.lessonId || 'lesson-' + Date.now(),
                title: contribution.data.lessonTitle,
                level: contribution.data.level,
                author: contribution.submittedBy?.username ? contribution.submittedBy.username : 'Community',
                description: contribution.data.description,
                content: contribution.data.newContent,
                status: 'published',
                publishedAt: new Date(),
                source: contribution.data.source || 'community'
            };

            // Check if lesson exists to update, or create new
            // We use 'id' field for compatibility with frontend IDs, not _id
            const existingLesson = await Lesson.findOne({ id: lessonData.id });

            if (existingLesson) {
                await Lesson.findOneAndUpdate({ id: lessonData.id }, lessonData);
            } else {
                await new Lesson(lessonData).save();
            }
        }

        res.json({ success: true, contribution });
    } catch (error) {
        console.error('Error updating contribution:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
