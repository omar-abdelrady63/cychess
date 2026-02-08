const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Tournament = require('../models/Tournament');
const TournamentParticipant = require('../models/TournamentParticipant');
const TournamentMatch = require('../models/TournamentMatch');
const { pairPlayersForRound, isRoundComplete } = require('../utils/tournamentPairing');

function generateInviteCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

router.post('/create', auth, async (req, res) => {
    try {
        const { name, rounds_count, time_control, increment, is_ranked } = req.body;

        if (!name || !rounds_count || !time_control) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const roundsNum = parseInt(rounds_count);
        if (roundsNum < 1 || roundsNum > 20) {
            return res.status(400).json({ error: 'Rounds count must be between 1 and 20' });
        }

        const timeMinutes = parseInt(time_control);
        const timeSeconds = timeMinutes * 60;
        const inc = parseInt(increment) || 0;

        let inviteCode;
        let codeExists = true;
        while (codeExists) {
            inviteCode = generateInviteCode();
            const existing = await Tournament.findOne({ invite_link: inviteCode });
            codeExists = !!existing;
        }

        const { v4: uuidv4 } = require('uuid');
        const tournament = new Tournament({
            tournament_id: uuidv4(),
            name,
            admin_id: req.userId,
            rounds_count: roundsNum,
            time_control: {
                initial: timeSeconds,
                increment: inc
            },
            is_ranked: is_ranked !== false,
            invite_link: inviteCode
        });

        await tournament.save();

        const adminParticipant = new TournamentParticipant({
            tournament_id: tournament._id,
            user_id: req.userId
        });
        await adminParticipant.save();

        console.log(`✓ Tournament created: ${tournament.name} (${inviteCode})`);

        res.json({
            success: true,
            tournament: {
                id: tournament._id,
                tournament_id: tournament.tournament_id,
                name: tournament.name,
                rounds_count: tournament.rounds_count,
                invite_link: inviteCode,
                status: tournament.status
            }
        });

    } catch (error) {
        console.error('Create tournament error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/join/:inviteCode', auth, async (req, res) => {
    try {
        const { inviteCode } = req.params;

        const tournament = await Tournament.findOne({ invite_link: inviteCode });
        if (!tournament) {
            return res.status(404).json({ error: 'Tournament not found' });
        }

        if (tournament.status !== 'waiting') {
            return res.status(400).json({ error: 'Tournament has already started' });
        }

        const existing = await TournamentParticipant.findOne({
            tournament_id: tournament._id,
            user_id: req.userId
        });

        if (existing) {
            return res.json({
                success: true,
                message: 'Already joined',
                tournament_id: tournament._id
            });
        }

        const participant = new TournamentParticipant({
            tournament_id: tournament._id,
            user_id: req.userId
        });
        await participant.save();

        const io = req.app.get('io');
        const populatedParticipant = await TournamentParticipant.findById(participant._id)
            .populate('user_id', 'username rating avatar');

        io.to(`tournament_${tournament._id}`).emit('tournament_participant_joined', {
            participant: {
                id: populatedParticipant._id,
                user: populatedParticipant.user_id,
                total_points: populatedParticipant.total_points
            }
        });

        console.log(`✓ User ${req.userId} joined tournament ${tournament.name}`);

        res.json({
            success: true,
            message: 'Joined tournament',
            tournament_id: tournament._id
        });

    } catch (error) {
        console.error('Join tournament error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/:tournamentId', auth, async (req, res) => {
    try {
        const tournament = await Tournament.findById(req.params.tournamentId)
            .populate('admin_id', 'username rating avatar');

        if (!tournament) {
            return res.status(404).json({ error: 'Tournament not found' });
        }

        const participants = await TournamentParticipant.find({ tournament_id: tournament._id })
            .populate('user_id', 'username rating avatar')
            .sort({ total_points: -1, wins: -1 });

        const currentMatches = await TournamentMatch.find({
            tournament_id: tournament._id,
            round_number: tournament.current_round
        })
            .populate({
                path: 'white_participant',
                populate: { path: 'user_id', select: 'username rating avatar' }
            })
            .populate({
                path: 'black_participant',
                populate: { path: 'user_id', select: 'username rating avatar' }
            })
            .populate('game_id');

        const isAdmin = tournament.admin_id._id.toString() === req.userId.toString();

        res.json({
            success: true,
            tournament: {
                id: tournament._id,
                tournament_id: tournament.tournament_id,
                name: tournament.name,
                admin: tournament.admin_id,
                rounds_count: tournament.rounds_count,
                current_round: tournament.current_round,
                time_control: tournament.time_control,
                is_ranked: tournament.is_ranked,
                status: tournament.status,
                invite_link: tournament.invite_link,
                created_at: tournament.created_at,
                started_at: tournament.started_at,
                completed_at: tournament.completed_at
            },
            participants: participants.map(p => ({
                id: p._id,
                user: p.user_id,
                total_points: p.total_points,
                wins: p.wins,
                draws: p.draws,
                losses: p.losses
            })),
            current_matches: currentMatches.map(m => ({
                id: m._id,
                round_number: m.round_number,
                white_participant: m.white_participant,
                black_participant: m.black_participant,
                game_id: m.game_id?._id,
                room_id: m.game_id?.room_id,
                is_bye: m.is_bye,
                status: m.status,
                result: m.result
            })),
            is_admin: isAdmin
        });

    } catch (error) {
        console.error('Get tournament error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/:tournamentId/start', auth, async (req, res) => {
    try {
        const tournament = await Tournament.findById(req.params.tournamentId);

        if (!tournament) {
            return res.status(404).json({ error: 'Tournament not found' });
        }

        if (tournament.admin_id.toString() !== req.userId.toString()) {
            return res.status(403).json({ error: 'Only tournament admin can start' });
        }

        if (tournament.status !== 'waiting') {
            return res.status(400).json({ error: 'Tournament already started' });
        }

        const participantCount = await TournamentParticipant.countDocuments({
            tournament_id: tournament._id
        });

        if (participantCount < 2) {
            return res.status(400).json({ error: 'Need at least 2 participants' });
        }

        tournament.status = 'active';
        tournament.current_round = 1;
        tournament.started_at = new Date();
        await tournament.save();

        const matches = await pairPlayersForRound(tournament._id, 1);

        const io = req.app.get('io');
        io.to(`tournament_${tournament._id}`).emit('tournament_started', {
            tournament_id: tournament._id,
            current_round: 1,
            matches: matches.map(m => ({
                id: m._id,
                round_number: m.round_number,
                is_bye: m.is_bye
            }))
        });

        matches.forEach(match => {
            if (!match.is_bye && match.game_id) {

                const whiteUserId = match.white_participant?.user_id?._id || match.white_participant?.user_id;
                if (whiteUserId) {
                    io.to(`user_${whiteUserId}`).emit('match_started', {
                        tournament_id: tournament._id,
                        room_id: match.game_id.room_id,
                        game_id: match.game_id._id,
                        role: 'white',
                        opponent: match.black_participant?.user_id
                    });
                }

                const blackUserId = match.black_participant?.user_id?._id || match.black_participant?.user_id;
                if (blackUserId) {
                    io.to(`user_${blackUserId}`).emit('match_started', {
                        tournament_id: tournament._id,
                        room_id: match.game_id.room_id,
                        game_id: match.game_id._id,
                        role: 'black',
                        opponent: match.white_participant?.user_id
                    });
                }
            }
        });

        console.log(`✓ Tournament started: ${tournament.name}`);

        res.json({
            success: true,
            message: 'Tournament started',
            current_round: 1,
            matches_created: matches.length
        });

    } catch (error) {
        console.error('Start tournament error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/:tournamentId/next-round', auth, async (req, res) => {
    try {
        const tournament = await Tournament.findById(req.params.tournamentId);

        if (!tournament) {
            return res.status(404).json({ error: 'Tournament not found' });
        }

        if (tournament.admin_id.toString() !== req.userId.toString()) {
            return res.status(403).json({ error: 'Only tournament admin can advance rounds' });
        }

        if (tournament.status !== 'active') {
            return res.status(400).json({ error: 'Tournament is not active' });
        }

        const roundComplete = await isRoundComplete(tournament._id, tournament.current_round);
        if (!roundComplete) {
            return res.status(400).json({ error: 'Current round is not complete' });
        }

        if (tournament.current_round >= tournament.rounds_count) {
            tournament.status = 'completed';
            tournament.completed_at = new Date();
            await tournament.save();

            const io = req.app.get('io');
            io.to(`tournament_${tournament._id}`).emit('tournament_completed', {
                tournament_id: tournament._id
            });

            console.log(`✓ Tournament completed: ${tournament.name}`);

            return res.json({
                success: true,
                message: 'Tournament completed',
                status: 'completed'
            });
        }

        tournament.current_round += 1;
        await tournament.save();

        const matches = await pairPlayersForRound(tournament._id, tournament.current_round);

        const io = req.app.get('io');
        io.to(`tournament_${tournament._id}`).emit('tournament_round_started', {
            tournament_id: tournament._id,
            round_number: tournament.current_round,
            matches: matches.map(m => ({
                id: m._id,
                round_number: m.round_number,
                is_bye: m.is_bye
            }))
        });

        matches.forEach(match => {
            if (!match.is_bye && match.game_id) {

                const whiteUserId = match.white_participant?.user_id?._id || match.white_participant?.user_id;
                if (whiteUserId) {
                    io.to(`user_${whiteUserId}`).emit('match_started', {
                        tournament_id: tournament._id,
                        room_id: match.game_id.room_id,
                        game_id: match.game_id._id,
                        role: 'white',
                        opponent: match.black_participant?.user_id
                    });
                }

                const blackUserId = match.black_participant?.user_id?._id || match.black_participant?.user_id;
                if (blackUserId) {
                    io.to(`user_${blackUserId}`).emit('match_started', {
                        tournament_id: tournament._id,
                        room_id: match.game_id.room_id,
                        game_id: match.game_id._id,
                        role: 'black',
                        opponent: match.white_participant?.user_id
                    });
                }
            }
        });

        console.log(`✓ Tournament round ${tournament.current_round} started: ${tournament.name}`);

        res.json({
            success: true,
            message: `Round ${tournament.current_round} started`,
            current_round: tournament.current_round,
            matches_created: matches.length
        });

    } catch (error) {
        console.error('Next round error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/:tournamentId/leaderboard', auth, async (req, res) => {
    try {
        const participants = await TournamentParticipant.find({
            tournament_id: req.params.tournamentId
        })
            .populate('user_id', 'username rating avatar')
            .sort({ total_points: -1, wins: -1, draws: -1 });

        const leaderboard = participants.map((p, index) => ({
            rank: index + 1,
            participant_id: p._id,
            user: p.user_id,
            total_points: p.total_points,
            wins: p.wins,
            draws: p.draws,
            losses: p.losses,
            games_played: p.wins + p.draws + p.losses
        }));

        res.json({
            success: true,
            leaderboard
        });

    } catch (error) {
        console.error('Get leaderboard error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
