const express = require('express');
const router = express.Router();
const Contribution = require('../models/Contribution');
const Lesson = require('../models/Lesson');

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

// GET pending requests
router.get('/pending', async (req, res) => {
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

// DELETE request
router.delete('/:id', async (req, res) => {
    try {
        const result = await Contribution.findOneAndDelete({ _id: req.params.id }); // Use _id for MongoDB auto-generated ID, or id if using custom
        // Check if we are using custom 'id' string or MongoDB '_id'
        // The service logic below will determine how we send IDs. Mongoose usually uses _id.
        // If the query fails to find by _id (if we sent a string like 'req-123'), we might try finding by 'id' field if schema had it?
        // But schema doesn't have 'id' field separately, relying on default _id.
        // Frontend sends 'id'. We need to make sure frontend sends _id or we map it.

        if (!result) {
            return res.status(404).json({ error: 'Contribution not found' });
        }
        res.json({ success: true, message: 'Contribution deleted' });
    } catch (error) {
        console.error('Error deleting contribution:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT update status (Approve/Reject)
router.put('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        if (!['approved', 'rejected', 'pending'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
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
                author: contribution.submittedBy && contribution.submittedBy.username ? contribution.submittedBy.username : 'Community',
                description: contribution.data.description,
                content: contribution.data.newContent,
                status: 'published',
                publishedAt: new Date()
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
