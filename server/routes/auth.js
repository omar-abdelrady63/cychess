const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { sendVerificationEmail } = require('../utils/emailService');

router.post('/register', [
    body('username').trim().isLength({ min: 3, max: 20 }).withMessage('Username must be 3-20 characters'),
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, email, password } = req.body;

        const existingEmail = await User.findOne({ email: email.toLowerCase() });
        if (existingEmail) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        const discriminator = await User.generateDiscriminator(username);

        const user = new User({
            username,
            discriminator,
            email: email.toLowerCase(),
            avatar: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${username}`
        });

        await user.setPassword(password);
        const verificationCode = user.generateVerificationCode();

        await user.save();

        await sendVerificationEmail(email, username, verificationCode);

        res.status(201).json({
            success: true,
            message: 'Registration successful! Please check your email for verification code.',
            user: {
                id: user._id,
                username: user.username,
                discriminator: user.discriminator,
                full_name: user.full_name,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Server error during registration' });
    }
});

router.post('/verify', [
    body('email').isEmail(),
    body('code').isLength({ min: 6, max: 6 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, code } = req.body;

        const user = await User.findOne({
            email: email.toLowerCase(),
            verification_code: code
        });

        if (!user) {
            return res.status(400).json({ error: 'Invalid verification code' });
        }

        user.is_verified = true;
        user.verification_code = undefined;
        await user.save();

        res.json({
            success: true,
            message: 'Email verified successfully! You can now log in.'
        });

    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ error: 'Server error during verification' });
    }
});

router.post('/login', [
    body('identifier').notEmpty().withMessage('Email or username#discriminator required'),
    body('password').notEmpty().withMessage('Password required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { identifier, password } = req.body;

        let user;

        if (identifier.includes('@')) {
            user = await User.findOne({ email: identifier.toLowerCase() });
        } else if (identifier.includes('#')) {
            const [username, discriminator] = identifier.split('#');
            user = await User.findOne({ username, discriminator });
        } else {
            return res.status(400).json({ error: 'Please use email or username#discriminator format' });
        }

        if (!user) {
            console.log(`Login failed: User not found for identifier '${identifier}'`);
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        if (!user.is_verified) {
            console.log(`Login failed: User '${user.username}' is not verified`);
            return res.status(400).json({ error: 'Please verify your email first' });
        }

        const isMatch = await user.checkPassword(password);
        if (!isMatch) {
            console.log(`Login failed: Password mismatch for user '${user.username}'`);
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user._id },
            process.env.SECRET_KEY || 'dev-secret-key-change-in-production',
            { expiresIn: '7d' }
        );

        user.is_online = true;
        user.last_seen = new Date();
        await user.save();

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                username: user.username,
                discriminator: user.discriminator,
                full_name: user.full_name,
                email: user.email,
                is_verified: user.is_verified
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
});

router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password_hash -verification_code');

        res.json({
            success: true,
            user: {
                id: user._id,
                username: user.username,
                discriminator: user.discriminator,
                full_name: user.full_name,
                email: user.email,
                is_verified: user.is_verified,
                is_online: user.is_online,
                created_at: user.created_at
            }
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.put('/update-profile', auth, [
    body('username').optional().trim().isLength({ min: 3, max: 20 })
], async (req, res) => {
    try {
        const { username } = req.body;
        const user = await User.findById(req.userId);

        if (username && username !== user.username) {
            const discriminator = await User.generateDiscriminator(username);
            user.username = username;
            user.discriminator = discriminator;
        }

        await user.save();
        res.json({ success: true, message: 'Profile updated successfully', user });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/regenerate-avatar', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        const randomSeed = Math.random().toString(36).substring(7);
        user.avatar = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${randomSeed}`;

        await user.save();
        res.json({ success: true, avatar: user.avatar });
    } catch (error) {
        console.error('Regenerate avatar error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.delete('/delete-account', auth, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.userId);
        res.json({ success: true, message: 'Account deleted successfully' });
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/logout', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (user) {
            user.is_online = false;
            user.last_seen = new Date();
            await user.save();
        }

        res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
