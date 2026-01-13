const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Validations
const registerValidation = [
    body('username')
        .isLength({ min: 3, max: 20 })
        .withMessage('El nombre de usuario debe tener entre 3 y 20 caracteres')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('El nombre de usuario solo puede contener letras, números y guiones bajos'),
    body('email')
        .isEmail()
        .withMessage('Debe ser un email válido')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 6 })
        .withMessage('La contraseña debe tener al menos 6 caracteres')
];

const loginValidation = [
    body('identifier')
        .notEmpty()
        .withMessage('Usuario o email requerido'),
    body('password')
        .notEmpty()
        .withMessage('Contraseña requerida')
];

// ================================
// AUTHENTICATION ROUTES
// ================================

router.post('/register', registerValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                message: errors.array()[0].msg 
            });
        }

        const { username, email, password } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({
            $or: [
                { email: email.toLowerCase() },
                { username: username.toLowerCase() }
            ]
        });

        if (existingUser) {
            if (existingUser.email === email.toLowerCase()) {
                return res.status(400).json({ 
                    message: 'El email ya está registrado' 
                });
            } else {
                return res.status(400).json({ 
                    message: 'El nombre de usuario ya está en uso' 
                });
            }
        }

        // Create new user
        const newUser = new User({
            username: username.toLowerCase(),
            email: email.toLowerCase(),
            password: password
        });

        await newUser.save();

        // Generate JWT
        const token = jwt.sign(
            { 
                userId: newUser._id.toString(),
                username: newUser.username,
                email: newUser.email,
                role: newUser.role
            },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'Usuario registrado exitosamente',
            token,
            user: newUser.toJSON()
        });

    } catch (error) {
        console.error('Error en registro:', error);
        
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            const message = field === 'email' ? 'El email ya está registrado' : 'El nombre de usuario ya está en uso';
            return res.status(400).json({ message });
        }
        
        res.status(500).json({ 
            message: 'Error interno del servidor' 
        });
    }
});

// POST /api/login - User login
router.post('/login/', loginValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                message: errors.array()[0].msg 
            });
        }

        const { identifier, password } = req.body;

        // Find user by email or username
        const user = await User.findByEmailOrUsername(identifier);

        if (!user) {
            return res.status(401).json({ 
                message: 'Credenciales inválidas' 
            });
        }

        // Verify password
        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            return res.status(401).json({ 
                message: 'Credenciales inválidas' 
            });
        }

        // Update streak on login
        user.updateStreak();
        await user.save();

        // Generate JWT
        const token = jwt.sign(
            { 
                userId: user._id.toString(),
                username: user.username,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login exitoso',
            token,
            user: user.toJSON(),
            streak: user.getStreakInfo()
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ 
            message: 'Error interno del servidor' 
        });
    }
});

// POST /api/auth/logout - User logout
router.post('/logout', authenticateToken, async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user._id, {
            'stats.lastActivity': new Date()
        });

        res.json({ 
            message: 'Logout exitoso' 
        });
    } catch (error) {
        console.error('Error en logout:', error);
        res.status(500).json({ 
            message: 'Error interno del servidor' 
        });
    }
});

// GET /api/auth/verify - Verify token
router.get('/verify', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        
        if (!user || !user.isActive) {
            return res.status(404).json({ 
                message: 'Usuario no encontrado o inactivo' 
            });
        }

        res.json({
            message: 'Token válido',
            user: user.toJSON(),
            streak: user.getStreakInfo()
        });
    } catch (error) {
        console.error('Error verificando token:', error);
        res.status(500).json({ 
            message: 'Error interno del servidor' 
        });
    }
});

// ================================
// PROFILE ROUTES
// ================================

// GET /api/auth/profile - Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        
        if (!user || !user.isActive) {
            return res.status(404).json({ 
                message: 'Usuario no encontrado' 
            });
        }

        res.json({
            user: user.toJSON(),
            streak: user.getStreakInfo()
        });
    } catch (error) {
        console.error('Error obteniendo perfil:', error);
        res.status(500).json({ 
            message: 'Error interno del servidor' 
        });
    }
});

// PUT /api/auth/profile - Update profile and preferences
router.put('/profile', authenticateToken, [
    body('profile.firstName').optional().isLength({ max: 50 }),
    body('profile.lastName').optional().isLength({ max: 50 }),
    body('profile.bio').optional().isLength({ max: 500 }),
    body('profile.level').optional().isIn(['A1', 'A2', 'B1', 'B2', 'C1']),
    body('preferences.darkMode').optional().isBoolean(),
    body('preferences.language').optional().isIn(['es', 'en', 'tr']),
    body('preferences.fontSize').optional().isIn(['small', 'medium', 'large']),
    body('preferences.notifications').optional().isBoolean(),
    body('preferences.sound').optional().isBoolean(),
    body('preferences.dailyGoal').optional().isInt({ min: 1, max: 100 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                message: errors.array()[0].msg 
            });
        }

        const user = await User.findById(req.user._id);
        
        if (!user) {
            return res.status(404).json({ 
                message: 'Usuario no encontrado' 
            });
        }

        // Update allowed fields
        if (req.body.profile) {
            user.profile = { ...user.profile.toObject(), ...req.body.profile };
        }
        
        if (req.body.preferences) {
            user.preferences = { ...user.preferences.toObject(), ...req.body.preferences };
        }

        await user.save();

        res.json({
            message: 'Perfil actualizado exitosamente',
            user: user.toJSON()
        });

    } catch (error) {
        console.error('Error actualizando perfil:', error);
        res.status(500).json({ 
            message: 'Error interno del servidor' 
        });
    }
});

// ================================
// STREAK ROUTES
// ================================

// POST /api/auth/update-streak - Update user's streak
router.post('/update-streak', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        
        if (!user) {
            return res.status(404).json({ 
                message: 'Usuario no encontrado' 
            });
        }
        
        // Update streak
        const currentStreak = user.updateStreak();
        await user.save();
        
        res.json({
            message: 'Racha actualizada',
            streak: user.getStreakInfo(),
            currentStreak: currentStreak
        });
    } catch (error) {
        console.error('Error actualizando racha:', error);
        res.status(500).json({ 
            message: 'Error interno del servidor' 
        });
    }
});

// GET /api/auth/streak - Get user's streak info
router.get('/streak', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        
        if (!user) {
            return res.status(404).json({ 
                message: 'Usuario no encontrado' 
            });
        }
        
        res.json({
            streak: user.getStreakInfo()
        });
    } catch (error) {
        console.error('Error obteniendo racha:', error);
        res.status(500).json({ 
            message: 'Error interno del servidor' 
        });
    }
});

module.exports = router;