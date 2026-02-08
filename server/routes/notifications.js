const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Notification = require('../models/Notification');
const Game = require('../models/Game');

router.get('/', auth, async (req, res) => {
    try {
        const notifications = await Notification.find({ user: req.userId })
            .sort({ created_at: -1 })
            .limit(50);

        const unread_count = await Notification.countDocuments({
            user: req.userId,
            is_read: false
        });

        res.json({
            notifications,
            unread_count
        });

    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/:id/read', auth, async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        if (notification.user.toString() !== req.userId.toString()) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        notification.is_read = true;
        await notification.save();

        res.json({ success: true });

    } catch (error) {
        console.error('Mark read error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/read-all', auth, async (req, res) => {
    try {
        await Notification.updateMany(
            { user: req.userId, is_read: false },
            { is_read: true }
        );

        res.json({ success: true });

    } catch (error) {
        console.error('Mark all read error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.delete('/:id', auth, async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        if (notification.user.toString() !== req.userId.toString()) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        await notification.deleteOne();

        res.json({ success: true });

    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/:id/accept-game', auth, async (req, res) => {
    try {
        if (!req.params.id || req.params.id === 'undefined' || !req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ error: 'Invalid notification ID' });
        }
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        if (notification.user.toString() !== req.userId.toString()) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        if (notification.type !== 'game_invite') {
            return res.status(400).json({ error: 'Invalid notification type' });
        }

        const { room_id } = notification.data;

        if (!room_id) {
            return res.status(400).json({ error: 'Room ID not found' });
        }

        const game = await Game.findOne({ room_id });

        if (!game) {
            return res.status(404).json({ error: 'Game not found' });
        }

        if (game.status === 'waiting' && !game.black_player) {
            game.black_player = req.userId;
            game.status = 'active';
            await game.save();

            const io = req.app.get('io');
            io.to(room_id).emit('game_start', {
                white_time: game.white_time,
                black_time: game.black_time,
                fen: game.fen,
                message: 'Game started!'
            });
        }

        notification.is_read = true;
        await notification.save();

        res.json({
            success: true,
            room_id,
            url: `/game/${room_id}`
        });

    } catch (error) {
        console.error('Accept game error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
