const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Game = require('../models/Game');
const FriendRequest = require('../models/FriendRequest');

router.get('/:username', auth, async (req, res) => {
    try {
        const user = await User.findOne({
            username: { $regex: new RegExp(`^${req.params.username}$`, 'i') }
        }).select('-password_hash -verification_code -email');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        let friendStatus = 'none'; 
        if (req.userId !== user._id.toString()) {
            const friendRequest = await FriendRequest.findOne({
                $or: [
                    { sender: req.userId, receiver: user._id },
                    { sender: user._id, receiver: req.userId }
                ]
            });

            if (friendRequest) {
                if (friendRequest.status === 'accepted') {
                    friendStatus = 'friends';
                } else if (friendRequest.sender.toString() === req.userId) {
                    friendStatus = 'sent';
                } else {
                    friendStatus = 'received';
                }
            }
        } else {
            friendStatus = 'self';
        }

        const stats = {
            wins: user.game_stats?.wins || 0,
            losses: user.game_stats?.losses || 0,
            draws: user.game_stats?.draws || 0,
            total: (user.game_stats?.wins || 0) + (user.game_stats?.losses || 0) + (user.game_stats?.draws || 0)
        };

        res.json({
            user: {
                id: user._id,
                username: user.username,
                discriminator: user.discriminator,
                avatar: user.avatar,
                rating: user.rating,
                created_at: user.created_at,
                is_online: user.is_online,
                last_seen: user.last_seen,
                stats
            },
            friend_status: friendStatus
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/:username/history', auth, async (req, res) => {
    try {
        const user = await User.findOne({
            username: { $regex: new RegExp(`^${req.params.username}$`, 'i') }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = 20;
        const skip = (page - 1) * limit;

        const query = {
            $or: [
                { white_player: user._id },
                { black_player: user._id }
            ],
            status: 'completed'
        };

        const total = await Game.countDocuments(query);
        const games = await Game.find(query)
            .sort({ completed_at: -1 })
            .skip(skip)
            .limit(limit)
            .populate('white_player', 'username rating avatar')
            .populate('black_player', 'username rating avatar');

        const history = games.map(game => {
            const isWhite = game.white_player._id.toString() === user._id.toString();
            const playerColor = isWhite ? 'white' : 'black';
            const opponent = isWhite ? game.black_player : game.white_player;

            let result = 'draw';
            if (game.result === 'white_win') {
                result = isWhite ? 'win' : 'loss';
            } else if (game.result === 'black_win') {
                result = isWhite ? 'loss' : 'win';
            }

            return {
                id: game._id,
                room_id: game.room_id,
                date: game.completed_at || game.created_at,
                opponent: {
                    username: opponent ? opponent.username : 'Unknown',
                    rating: opponent ? opponent.rating : '?',
                    avatar: opponent ? opponent.avatar : ''
                },
                result,
                termination: game.termination_reason,
                color: playerColor,
                moves_count: Math.ceil(game.moves.length / 2)
            };
        });

        res.json({
            history,
            pagination: {
                current: page,
                pages: Math.ceil(total / limit),
                total
            }
        });

    } catch (error) {
        console.error('Get history error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/:username/friends', auth, async (req, res) => {
    try {
        const user = await User.findOne({
            username: { $regex: new RegExp(`^${req.params.username}$`, 'i') }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const friends = await user.getFriends();

        const friendsList = friends.map(f => ({
            username: f.username,
            avatar: f.avatar,
            rating: f.rating,
            is_online: f.is_online
        }));

        res.json({ friends: friendsList });

    } catch (error) {
        console.error('Get user friends error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
