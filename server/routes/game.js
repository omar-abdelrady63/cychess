const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const auth = require('../middleware/auth');
const Game = require('../models/Game');
const User = require('../models/User');
const Notification = require('../models/Notification');


router.post('/create', auth, async (req, res) => {
    try {
        const { time_control, increment, preferred_color } = req.body;

        const minutes = parseInt(time_control) || 10;
        const inc = parseInt(increment) || 0;

        const totalSeconds = minutes * 60;
        let whitePlayerId = req.userId;
        let blackPlayerId = null;

        if (preferred_color === 'black') {
            whitePlayerId = null;
            blackPlayerId = req.userId;
        } else if (preferred_color === 'random') {
            const isWhite = Math.random() < 0.5;
            if (!isWhite) {
                whitePlayerId = null;
                blackPlayerId = req.userId;
            }
        }

        const game = new Game({
            room_id: uuidv4(),
            white_player: whitePlayerId,
            black_player: blackPlayerId,
            time_control: {
                initial: totalSeconds,
                increment: inc
            },
            white_time: totalSeconds,
            black_time: totalSeconds,
            last_move_time: null
        });

        await game.save();

        res.json({
            success: true,
            room_id: game.room_id,
            url: `/game/${game.room_id}`,
            your_color: (whitePlayerId && whitePlayerId.toString() === req.userId.toString()) ? 'white' : 'black'
        });

    } catch (error) {
        console.error('Create game error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});


router.post('/join', auth, async (req, res) => {
    try {
        const { room_id } = req.body;
        const game = await Game.findOne({ room_id });

        if (!game) {
            return res.status(404).json({ error: 'Game not found' });
        }

        if ((game.white_player && game.white_player.toString() === req.userId) ||
            (game.black_player && game.black_player.toString() === req.userId)) {
            return res.json({ success: true, message: 'Rejoined game', your_color: game.white_player.toString() === req.userId ? 'white' : 'black' });
        }

        if (!game.white_player) {
            game.white_player = req.userId;
        } else if (!game.black_player) {
            game.black_player = req.userId;
        } else {
            return res.status(400).json({ error: 'Game is full' });
        }

        if (game.white_player && game.black_player) {
            game.status = 'active';
            game.last_move_time = new Date();

            await game.populate('white_player', 'username rating avatar');
            await game.populate('black_player', 'username rating avatar');

            const io = req.app.get('io');
            io.to(room_id).emit('game_start', {
                white_player: game.white_player,
                black_player: game.black_player,
                white_time: game.white_time,
                black_time: game.black_time,
                fen: game.fen,
                message: 'Game started!'
            });
        }

        await game.save();

        const userColor = game.white_player._id.toString() === req.userId.toString() ? 'white' : 'black';
        return res.json({ success: true, message: `Joined as ${userColor}`, your_color: userColor });

    } catch (error) {
        console.error('Join game error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/history', auth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const perPage = parseInt(req.query.per_page) || 10;
        const skip = (page - 1) * perPage;

        const query = {
            $or: [
                { white_player: req.userId },
                { black_player: req.userId }
            ],
            white_player: { $ne: null },
            black_player: { $ne: null },
            status: 'completed'
        };

        const total = await Game.countDocuments(query);
        const games = await Game.find(query)
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(perPage)
            .populate('white_player', 'username discriminator')
            .populate('black_player', 'username discriminator');

        const gamesData = games.map(game => ({
            id: game._id,
            room_id: game.room_id,
            white_player_id: game.white_player?._id,
            black_player_id: game.black_player?._id,
            white_player_username: game.white_player?.username || 'Unknown',
            black_player_username: game.black_player?.username || 'Unknown',
            status: game.status,
            result: game.result,
            created_at: game.created_at,
            completed_at: game.completed_at
        }));

        res.json({
            games: gamesData,
            pagination: {
                page,
                per_page: perPage,
                total,
                pages: Math.ceil(total / perPage),
                has_next: page < Math.ceil(total / perPage),
                has_prev: page > 1
            }
        });

    } catch (error) {
        console.error('Get history error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});


router.get('/:roomId', auth, async (req, res) => {
    try {
        const game = await Game.findOne({ room_id: req.params.roomId })
            .populate('black_player', 'username rating avatar')
            .populate('winner', 'username');

        if (!game) {
            return res.status(404).json({ error: 'Game not found' });
        }

        const isWhite = game.white_player && game.white_player._id.toString() === req.userId.toString();
        const isBlack = game.black_player && game.black_player._id.toString() === req.userId.toString();

        res.json({
            success: true,
            is_player: isWhite || isBlack,
            user_side: isWhite ? 'white' : (isBlack ? 'black' : 'spectator'),
            game: {
                id: game._id,
                room_id: game.room_id,
                white_player: game.white_player,
                black_player: game.black_player,
                fen: game.fen,
                pgn: game.pgn,
                status: game.status,
                white_time: game.white_time,
                black_time: game.black_time,
                time_control: game.time_control,
                current_turn: game.current_turn,
                last_move_time: game.last_move_time,
                result: game.result,
                termination_reason: game.termination_reason
            }
        });

    } catch (error) {
        console.error('Get game error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/:roomId/moves', auth, async (req, res) => {
    try {
        const game = await Game.findOne({ room_id: req.params.roomId });
        if (!game) return res.status(404).json({ error: 'Game not found' });

        const moves = game.moves.map((m, index) => ({
            move_number: index + 1,
            san: m.san,
            uci: m.from + m.to,
            fen: m.fen_after
        }));

        res.json({ success: true, moves });

    } catch (error) {
        console.error('Get moves error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/invite/:friendId', auth, async (req, res) => {
    try {
        const { room_id } = req.body;

        if (!room_id) {
            return res.status(400).json({ error: 'Room ID required' });
        }

        const game = await Game.findOne({ room_id });
        if (!game) {
            return res.status(404).json({ error: 'Game not found' });
        }

        const isCreator = (game.white_player && game.white_player.toString() === req.userId.toString()) ||
            (game.black_player && game.black_player.toString() === req.userId.toString());

        if (!isCreator) {
            return res.status(403).json({ error: 'Only room creator can invite' });
        }

        const friend = await User.findById(req.params.friendId);
        if (!friend) {
            return res.status(404).json({ error: 'Friend not found' });
        }

        const notification = new Notification({
            user: friend._id,
            type: 'game_invite',
            title: 'Game Invitation',
            message: `${req.user.username} invited you to play chess`,
            data: {
                room_id: room_id,
                sender_id: req.userId,
                sender_username: req.user.username
            }
        });
        await notification.save();

        req.app.get('io').to(`user_${friend._id}`).emit('new_notification', {
            id: notification._id,
            type: 'game_invite',
            title: 'Game Invitation',
            message: `${req.user.username} invited you to play chess`,
            data: notification.data
        });

        res.json({
            success: true,
            message: `Invite sent to ${friend.username}`,
            invite_url: `/game/${room_id}`
        });

    } catch (error) {
        console.error('Invite error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/:gameId/pgn', auth, async (req, res) => {
    try {
        const game = await Game.findById(req.params.gameId);

        if (!game) {
            return res.status(404).json({ error: 'Game not found' });
        }

        const isPlayer = game.white_player.toString() === req.userId.toString() ||
            (game.black_player && game.black_player.toString() === req.userId.toString());

        if (!isPlayer) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        res.json({
            success: true,
            pgn: game.pgn || ''
        });

    } catch (error) {
        console.error('Get PGN error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/:roomId/moves', auth, async (req, res) => {
    try {
        const game = await Game.findOne({ room_id: req.params.roomId });
        if (!game) return res.status(404).json({ error: 'Game not found' });

        const moves = game.moves.map((m, index) => ({
            move_number: index + 1,
            san: m.san,
            uci: m.from + m.to,
            fen: m.fen_after
        }));

        res.json({ success: true, moves });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
