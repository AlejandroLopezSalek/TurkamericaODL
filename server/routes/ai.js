const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ChatLog = require('../models/ChatLog');
const path = require('path');

// Load Lesson Data for Context
let allLessons = {};
try {
    const a1 = require('../../src/data/a1_lessons.json');
    const a2 = require('../../src/data/a2_lessons.json');
    const b1 = require('../../src/data/b1_lessons.json');
    const b2 = require('../../src/data/b2_lessons.json');
    const c1 = require('../../src/data/c1_lessons.json');
    allLessons = { ...a1, ...a2, ...b1, ...b2, ...c1 };
} catch (e) {
    console.warn("Could not load lesson data for AI context:", e.message);
}

// Rate limiting specifically for AI chat to prevent abuse
const aiLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // Limit each IP to 50 requests per hour
    message: { error: 'Too many AI requests, please try again later.' }
});

router.use(aiLimiter);

// Initialize Groq Client
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

// Helper to get user from token
const getUserFromRequest = async (req) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return null;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        return await User.findById(decoded.userId);
    } catch (err) {
        return null;
    }
};

// POST / (Mounted at /api/chat)
router.post('/', async (req, res) => {
    try {
        const { message, context, history } = req.body;
        const user = await getUserFromRequest(req);

        if (!process.env.GROQ_API_KEY) {
            console.error('SERVER ERROR: GROQ_API_KEY is missing in .env');
            return res.status(503).json({
                error: 'Service unavailable',
                message: 'AI service is not configured on the server.'
            });
        }

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // --- CONTEXT INJECTION ---
        let userContext = "User: Guest";
        let memoryContext = "";

        if (user) {
            userContext = `User: ${user.username} | Level: ${user.profile?.level || 'A1'} | Streak: ${user.stats?.streak || 0} days`;
            if (user.stats?.lastViewedLesson?.title) {
                memoryContext = `\nMEMORY: The user was last studying "${user.stats.lastViewedLesson.title}".`;
            }
        }

        // Active Lesson Context
        let lessonContentContext = "";
        let currentPage = "";

        // Handle context object or string
        if (typeof context === 'object' && context.page) {
            currentPage = context.page;
        } else if (typeof context === 'string') {
            // Try to extract path from string if possible, or just search it
            if (context.includes('/')) currentPage = context;
        }

        if (currentPage && (currentPage.includes('/Lesson/') || currentPage.includes('/Leccion/'))) {
            // Extract slug: /Lesson/a1/alfabeto/ -> alfabeto
            // Remove trailing slash if present
            const cleanPath = currentPage.endsWith('/') ? currentPage.slice(0, -1) : currentPage;
            const parts = cleanPath.split('/');
            const slug = parts[parts.length - 1];

            if (slug && allLessons[slug]) {
                const lesson = allLessons[slug];
                // Strip HTML tags for cleaner token usage
                const cleanContent = lesson.content.replace(/<[^>]*>?/gm, ' ');
                lessonContentContext = `
*** ACTIVE LESSON CONTEXT ***
User is currently viewing the lesson: "${lesson.title}"
Content: ${cleanContent.substring(0, 1500)}...
(Use this information to answer specific questions about the lesson topic)
`;
            }
        }

        // System Prompt Construction
        const contextStr = typeof context === 'object' ? JSON.stringify(context) : String(context || '');

        let specialInstructions = "";
        if (contextStr.includes('Contribuir') || contextStr.includes('Admin') || contextStr.includes('Lección')) {
            specialInstructions = `
*** SPECIAL CONTEXT: LESSON MODE ***
If the user is creating a lesson (Contribute), assist with Turkish examples and grammar.
If the user is viewing a lesson, answer based on the ACTIVE LESSON CONTEXT provided below.
`;
        }

        let systemPrompt = `You are "Capi", the AI mascot for "TurkAmerica".
Your goal: Help Spanish speakers learn Turkish correctly.

CONTEXT:
${userContext}
${lessonContentContext}
Current Page: ${contextStr || 'General Dashboard'}${memoryContext}

CRITICAL RULES:
1. **Language**: EXPLAIN in Spanish, but PROVIDE EXAMPLES in Turkish.
2. **Clarity**: Finish your sentences. Do not trail off.
3. **Grammar**: When explaining grammar, be structured. Don't mix Spanish endings into Turkish words unless comparing them.
4. **Personality**: You can use emojis to be friendly! 🌟
5. **Length**: If the answer is long, break it into bullet points.

${specialInstructions}

NAVIGATION:
- Only navigate if explicitly asked (e.g., "Ir a perfil").
- Valid: /Inicio, /Consejos/, /Gramatica/, /Community-Lessons/, /NivelA1/ thru /NivelC1/, /Perfil/
- Example: "Llevame a perfil" -> "Vamos al perfil. [[NAVIGATE:/Perfil/]]"`;

        const messages = [{ role: "system", content: systemPrompt }];

        // Add history
        if (Array.isArray(history)) {
            const recentHistory = history.slice(-4);
            recentHistory.forEach(msg => {
                if (msg.role && msg.content) messages.push(msg);
            });
        }

        messages.push({ role: "user", content: message });

        const chatCompletion = await groq.chat.completions.create({
            messages: messages,
            model: "llama-3.3-70b-versatile",
            temperature: 0.6,
            max_tokens: 1024,
        });

        const reply = chatCompletion.choices[0]?.message?.content || "Lo siento, no pude procesar eso.";

        res.json({ reply });

        // LOG INTERACTION ASYNC
        try {
            await ChatLog.create({
                userId: user ? user._id : null,
                username: user ? user.username : 'Guest',
                userMessage: message,
                aiResponse: reply,
                context: typeof context === 'object' ? context : { raw: context },
                lessonContext: lessonContentContext ? lessonContentContext.substring(0, 100) + '...' : '', // Save snippet
                metadata: {
                    ip: req.ip,
                    userAgent: req.get('User-Agent')
                }
            });
        } catch (logStatsError) {
            console.error('Failed to log chat:', logStatsError.message);
        }

    } catch (error) {
        console.error(' Groq API Error:', error);

        // Return specific error message for debugging
        res.status(500).json({
            error: 'AI Error',
            message: error.message || 'Hubo un error al conectar con el asistente.',
            details: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
});

module.exports = router;
