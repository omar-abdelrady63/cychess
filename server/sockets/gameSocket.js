const { Chess } = require('chess.js');
const Game = require('../models/Game');
const User = require('../models/User');
const { calculateEloRating } = require('../utils/elo');
const { updateTournamentStandings } = require('../utils/tournamentPairing');

async function updateRatings(game) {
    if (!game.result || !game.white_player || !game.black_player) return null;

    try {
        const whiteUser = await User.findById(game.white_player);
        const blackUser = await User.findById(game.black_player);

        if (!whiteUser || !blackUser) return null;

        let whiteScore = 0.5;
        if (game.result === 'white_win') whiteScore = 1;
        else if (game.result === 'black_win') whiteScore = 0;

        const blackScore = 1 - whiteScore;

        const whiteNewRating = calculateEloRating(whiteUser.rating, blackUser.rating, whiteScore);
        const blackNewRating = calculateEloRating(blackUser.rating, whiteUser.rating, blackScore);

        whiteUser.rating = whiteNewRating;
        blackUser.rating = blackNewRating;

        if (game.result === 'white_win') {
            whiteUser.game_stats.wins += 1;
            blackUser.game_stats.losses += 1;
        } else if (game.result === 'black_win') {
            whiteUser.game_stats.losses += 1;
            blackUser.game_stats.wins += 1;
        } else {
            whiteUser.game_stats.draws += 1;
            blackUser.game_stats.draws += 1;
        }

        await whiteUser.save();
        await blackUser.save();

        return { white_new_rating: whiteNewRating, black_new_rating: blackNewRating };
    } catch (err) {
        console.error('Error updating ratings:', err);
        return null;
    }
}

const abandonmentTimers = new Map();

const roomSpectators = new Map();

const matchmakingQueue = new Map();
let matchmakingInterval = null;

const MAX_RATING_RANGE = 1000; 
const INITIAL_RANGE = 50; 
const RANGE_EXPANSION = 50; 
const MATCHING_INTERVAL = 2000; 

async function broadcastStatusToFriends(io, userId, newStatus) {
    try {
        const user = await User.findById(userId);
        if (!user) return;

        const friends = await user.getFriends();
        friends.forEach(friend => {
            io.to(`user_${friend._id}`).emit('friend_status_update', {
                user_id: userId.toString(),
                status: newStatus
            });
        });
    } catch (err) {
        console.error('Error broadcasting status:', err);
    }
}

function broadcastSystemMessage(io, room_id, message) {
    io.to(room_id).emit('chat_system_message', {
        text: message,
        timestamp: new Date().toISOString(),
        type: 'system'
    });
}

async function processMatchmakingQueue(io) {
    if (matchmakingQueue.size < 2) return;

    const queueArray = Array.from(matchmakingQueue.entries());
    const matched = new Set();

    for (const [userId, userData] of queueArray) {
        if (matched.has(userId)) continue;

        userData.currentRange += RANGE_EXPANSION;

        if (userData.currentRange > MAX_RATING_RANGE) {
            io.to(`user_${userId}`).emit('match_cancelled', {
                message: 'No players found in your rating range'
            });
            matchmakingQueue.delete(userId);
            console.log(`❌ Matchmaking cancelled for user ${userId} - max range exceeded`);
            continue;
        }

        for (const [otherUserId, otherUserData] of queueArray) {
            if (userId === otherUserId || matched.has(otherUserId)) continue;

            if (userData.timeControl !== otherUserData.timeControl) continue;

            const ratingDiff = Math.abs(userData.rating - otherUserData.rating);
            const withinUser1Range = ratingDiff <= userData.currentRange;
            const withinUser2Range = ratingDiff <= otherUserData.currentRange;

            if (withinUser1Range && withinUser2Range) {

                matched.add(userId);
                matched.add(otherUserId);

                try {
                    await createMatchmakingGame(io, userId, otherUserId, userData.timeControl);
                } catch (error) {
                    console.error('Error creating matchmaking game:', error);
                }

                break;
            }
        }

        if (!matched.has(userId)) {
            const minRating = userData.rating - userData.currentRange;
            const maxRating = userData.rating + userData.currentRange;
            io.to(`user_${userId}`).emit('rating_range_update', {
                minRating,
                maxRating,
                currentRange: userData.currentRange
            });
        }
    }

    for (const userId of matched) {
        matchmakingQueue.delete(userId);
    }
}

async function createMatchmakingGame(io, userId1, userId2, timeControl) {
    const { v4: uuidv4 } = require('uuid');

    const isUser1White = Math.random() < 0.5;
    const whitePlayerId = isUser1White ? userId1 : userId2;
    const blackPlayerId = isUser1White ? userId2 : userId1;

    const totalSeconds = timeControl * 60;

    const game = new Game({
        room_id: uuidv4(),
        white_player: whitePlayerId,
        black_player: blackPlayerId,
        time_control: {
            initial: totalSeconds,
            increment: 0
        },
        white_time: totalSeconds,
        black_time: totalSeconds,
        status: 'active',
        last_move_time: new Date()
    });

    await game.save();
    await game.populate('white_player', 'username rating avatar');
    await game.populate('black_player', 'username rating avatar');

    io.to(`user_${userId1}`).emit('match_found', {
        room_id: game.room_id,
        your_color: isUser1White ? 'white' : 'black',
        opponent: isUser1White ? game.black_player : game.white_player,
        white_player: game.white_player,
        black_player: game.black_player
    });

    io.to(`user_${userId2}`).emit('match_found', {
        room_id: game.room_id,
        your_color: isUser1White ? 'black' : 'white',
        opponent: isUser1White ? game.white_player : game.black_player,
        white_player: game.white_player,
        black_player: game.black_player
    });

    console.log(`✓ Match created: ${game.room_id} - ${whitePlayerId} (white) vs ${blackPlayerId} (black)`);
}

function startMatchmakingInterval(io) {
    if (matchmakingInterval) return;

    matchmakingInterval = setInterval(() => {
        processMatchmakingQueue(io);
    }, MATCHING_INTERVAL);

    console.log('✓ Matchmaking interval started');
}

function registerGameSocket(io) {
    io.on('connection', (socket) => {
        console.log(` User connected: ${socket.id}`);

        socket.on('authenticate', async (data) => {
            const { userId } = data;
            if (userId) {
                socket.userId = userId;
                socket.join(`user_${userId}`);
                await User.findByIdAndUpdate(userId, { status: 'online' });
                await broadcastStatusToFriends(io, userId, 'online');
                console.log(`✓ User ${userId} authenticated`);

                try {
                    const activeGame = await Game.findOne({
                        $or: [{ white_player: userId }, { black_player: userId }],
                        status: 'active'
                    });

                    if (activeGame) {
                        socket.emit('active_game_found', { room_id: activeGame.room_id });
                    }
                } catch (err) {
                    console.error('Error checking for active game:', err);
                }

                startMatchmakingInterval(io);
            }
        });

        socket.on('join_matchmaking_queue', async (data) => {
            const { timeControl } = data;

            if (!socket.userId) {
                socket.emit('error', { message: 'Not authenticated' });
                return;
            }

            try {
                const user = await User.findById(socket.userId);
                if (!user) {
                    socket.emit('error', { message: 'User not found' });
                    return;
                }

                matchmakingQueue.set(socket.userId.toString(), {
                    rating: user.rating,
                    timeControl: parseInt(timeControl),
                    joinedAt: new Date(),
                    currentRange: INITIAL_RANGE
                });

                await User.findByIdAndUpdate(socket.userId, { status: 'online' });

                console.log(`✓ User ${socket.userId} joined matchmaking queue (rating: ${user.rating}, time: ${timeControl}min)`);

                socket.emit('queue_joined', {
                    message: 'Searching for opponent...',
                    initialRange: INITIAL_RANGE
                });

            } catch (error) {
                console.error('Join matchmaking queue error:', error);
                socket.emit('error', { message: 'Failed to join queue' });
            }
        });

        socket.on('leave_matchmaking_queue', async () => {
            if (!socket.userId) return;

            const userId = socket.userId.toString();
            if (matchmakingQueue.has(userId)) {
                matchmakingQueue.delete(userId);
                console.log(`✓ User ${userId} left matchmaking queue`);

                socket.emit('queue_left', {
                    message: 'Matchmaking cancelled'
                });
            }
        });

        socket.on('join_game', async (data) => {
            const { room_id } = data;
            try {
                const game = await Game.findOne({ room_id });
                if (!game) {
                    socket.emit('error', { message: 'Game not found' });
                    return;
                }

                socket.join(room_id);
                socket.currentRoom = room_id;
                console.log(` User joined room: ${room_id}`);

                await game.populate('white_player', 'username rating avatar');
                await game.populate('black_player', 'username rating avatar');

                if (socket.userId) {
                    const timerData = abandonmentTimers.get(room_id);
                    if (timerData && timerData.userId.toString() === socket.userId.toString()) {
                        clearTimeout(timerData.timeout);
                        abandonmentTimers.delete(room_id);
                        io.to(room_id).emit('abandonment_canceled');
                        console.log(`Abandonment canceled for room ${room_id} by user ${socket.userId}`);
                    }

                    const whiteId = game.white_player?._id?.toString() || game.white_player?.toString();
                    const blackId = game.black_player?._id?.toString() || game.black_player?.toString();
                    const isPlayer = (whiteId === socket.userId.toString()) || (blackId === socket.userId.toString());

                    if (isPlayer) {
                        await User.findByIdAndUpdate(socket.userId, { status: 'in_game' });
                        await broadcastStatusToFriends(io, socket.userId, 'in_game');
                    }
                }

                socket.emit('player_joined', {
                    game_status: game.status,
                    fen: game.fen,
                    white_player: game.white_player,
                    black_player: game.black_player,
                    white_time: game.white_time,
                    black_time: game.black_time,
                    current_turn: game.current_turn,
                    last_move_time: game.last_move_time
                });

                if (game.status === 'active' && game.white_player && game.black_player) {
                    const joiningUser = await User.findById(socket.userId);
                    if (joiningUser) {
                        broadcastSystemMessage(io, room_id, `${joiningUser.username} joined the game`);
                    }
                }

                const existingTimer = abandonmentTimers.get(room_id);
                if (existingTimer) {
                    const abandoningUserId = existingTimer.userId.toString();
                    const whiteId = game.white_player?._id?.toString() || game.white_player?.toString();
                    const blackId = game.black_player?._id?.toString() || game.black_player?.toString();

                    let abandoningColor = null;
                    if (whiteId === abandoningUserId) abandoningColor = 'white';
                    if (blackId === abandoningUserId) abandoningColor = 'black';

                    if (abandoningColor) {
                        socket.emit('abandonment_warning', {
                            player_color: abandoningColor,
                            seconds_remaining: 30
                        });
                    }
                }

            } catch (error) {
                console.error('Join error:', error);
            }
        });

        socket.on('spectate_game', async (data) => {
            const { room_id } = data;
            try {
                const game = await Game.findOne({ room_id });
                if (!game) {
                    socket.emit('error', { message: 'Game not found' });
                    return;
                }

                if (!roomSpectators.has(room_id)) {
                    roomSpectators.set(room_id, new Set());
                }

                socket.join(room_id);
                socket.currentRoom = room_id;
                socket.isSpectator = true;

                if (socket.userId) {
                    roomSpectators.get(room_id).add(socket.userId.toString());
                    await User.findByIdAndUpdate(socket.userId, { status: 'spectating' });
                    await broadcastStatusToFriends(io, socket.userId, 'spectating');
                }

                console.log(`✓ User ${socket.userId} spectating room: ${room_id}`);

                await game.populate('white_player', 'username rating avatar');
                await game.populate('black_player', 'username rating avatar');

                socket.emit('spectator_joined', {
                    game_status: game.status,
                    fen: game.fen,
                    white_player: game.white_player,
                    black_player: game.black_player,
                    white_time: game.white_time,
                    black_time: game.black_time,
                    current_turn: game.current_turn,
                    last_move_time: game.last_move_time,
                    result: game.result,
                    termination_reason: game.termination_reason
                });

            } catch (error) {
                console.error('Spectate error:', error);
            }
        });

        socket.on('leave_spectate', async (data) => {
            const { room_id } = data;
            try {
                if (socket.userId && roomSpectators.has(room_id)) {
                    roomSpectators.get(room_id).delete(socket.userId.toString());
                    if (roomSpectators.get(room_id).size === 0) {
                        roomSpectators.delete(room_id);
                    }
                }

                socket.leave(room_id);
                socket.isSpectator = false;
                socket.currentRoom = null;

                if (socket.userId) {
                    await User.findByIdAndUpdate(socket.userId, { status: 'online' });
                    await broadcastStatusToFriends(io, socket.userId, 'online');
                }

                console.log(`✓ User ${socket.userId} left spectating room: ${room_id}`);
            } catch (error) {
                console.error('Leave spectate error:', error);
            }
        });

        socket.on('make_move', async (data) => {
            const { room_id, move: moveUci } = data;

            try {
                const game = await Game.findOne({ room_id });

                if (!game || game.status !== 'active') {
                    socket.emit('error', { message: 'Game not active' });
                    return;
                }

                const isWhiteTurn = game.current_turn === 'white';
                const currentPlayerId = isWhiteTurn ? game.white_player : game.black_player;

                if (!socket.userId || currentPlayerId.toString() !== socket.userId.toString()) {
                    socket.emit('error', { message: 'Not your turn or not your game' });
                    return;
                }

                if (abandonmentTimers.has(room_id)) {
                    const t = abandonmentTimers.get(room_id);
                    if (t.userId.toString() === socket.userId.toString()) {
                        clearTimeout(t.timeout);
                        abandonmentTimers.delete(room_id);
                        io.to(room_id).emit('abandonment_canceled');
                    }
                }

                const now = new Date();
                let timeElapsed = 0;

                if (game.last_move_time) {
                    timeElapsed = (now - new Date(game.last_move_time)) / 1000;
                }

                if (isWhiteTurn) {
                    game.white_time -= timeElapsed;
                } else {
                    game.black_time -= timeElapsed;
                }

                if (game.white_time <= 0 || game.black_time <= 0) {
                    game.status = 'completed';
                    game.termination_reason = 'timeout';
                    game.result = isWhiteTurn ? 'black_win' : 'white_win';
                    game.winner = isWhiteTurn ? game.black_player : game.white_player;
                    game.completed_at = now;

                    await game.save();

                    const newRatings = await updateRatings(game);

                    io.to(room_id).emit('game_over', {
                        result: game.result,
                        reason: 'timeout',
                        winner: game.winner,
                        new_ratings: newRatings
                    });

                    if (abandonmentTimers.has(room_id)) {
                        clearTimeout(abandonmentTimers.get(room_id).timeout);
                        abandonmentTimers.delete(room_id);
                    }

                    return;
                }

                const increment = game.time_control?.increment || 0;
                if (isWhiteTurn) {
                    game.white_time += increment;
                } else {
                    game.black_time += increment;
                }

                const chess = new Chess(game.fen);
                let move;
                try {
                    move = chess.move(moveUci, { sloppy: true });
                } catch (e) { console.log(e) }

                if (!move) {
                    socket.emit('error', { message: 'Illegal move' });
                    return;
                }

                game.fen = chess.fen();
                game.current_turn = isWhiteTurn ? 'black' : 'white';
                game.last_move_time = now;

                if (!game.pgn) game.pgn = '';
                const moveString = isWhiteTurn
                    ? `${Math.ceil((chess.moveNumber() || 1))}. ${move.san} `
                    : `${move.san} `;
                game.pgn += moveString;

                if (chess.isCheckmate()) {
                    game.status = 'completed';
                    game.termination_reason = 'checkmate';
                    game.result = isWhiteTurn ? 'white_win' : 'black_win';
                    game.winner = socket.userId;
                    game.completed_at = now;
                } else if (chess.isDraw()) {
                    game.status = 'completed';
                    game.result = 'draw';
                    game.completed_at = now;

                    if (chess.isStalemate()) game.termination_reason = 'stalemate';
                    else if (chess.isInsufficientMaterial()) game.termination_reason = 'insufficient_material';
                    else if (chess.isThreefoldRepetition()) game.termination_reason = 'threefold_repetition';
                    else game.termination_reason = 'draw';
                }

                game.moves.push({
                    from: move.from,
                    to: move.to,
                    color: game.current_turn === 'white' ? 'black' : 'white',
                    piece: move.piece,
                    san: move.san,
                    fen_after: chess.fen(),
                    timestamp: now
                });

                await game.save();

                let newRatings = null;
                if (game.status === 'completed') {
                    newRatings = await updateRatings(game);
                }

                io.to(room_id).emit('move_made', {
                    move: move.from + move.to + (move.promotion || ''),
                    san: move.san,
                    fen: game.fen,
                    white_time: game.white_time,
                    black_time: game.black_time,
                    current_turn: game.current_turn,
                    game_status: game.status,
                    result: game.result,
                    termination_reason: game.termination_reason,
                    game_over: game.status === 'completed',
                    new_ratings: newRatings
                });

                if (game.status === 'completed' && abandonmentTimers.has(room_id)) {
                    clearTimeout(abandonmentTimers.get(room_id).timeout);
                    abandonmentTimers.delete(room_id);
                }

                if (game.status === 'completed') {

                    try {
                        const tournamentUpdate = await updateTournamentStandings(game._id);
                        if (tournamentUpdate) {
                            io.to(`tournament_${tournamentUpdate.tournamentId}`).emit('tournament_match_completed', {
                                match_id: tournamentUpdate.matchId,
                                result: game.result
                            });
                            io.to(`tournament_${tournamentUpdate.tournamentId}`).emit('tournament_leaderboard_update', {
                                tournament_id: tournamentUpdate.tournamentId
                            });
                        }
                    } catch (err) {
                        console.error('Error updating tournament standings:', err);
                    }

                    const whiteId = game.white_player?._id || game.white_player;
                    const blackId = game.black_player?._id || game.black_player;

                    if (whiteId) {
                        await User.findByIdAndUpdate(whiteId, { status: 'online' });
                        await broadcastStatusToFriends(io, whiteId, 'online');
                    }
                    if (blackId) {
                        await User.findByIdAndUpdate(blackId, { status: 'online' });
                        await broadcastStatusToFriends(io, blackId, 'online');
                    }
                }

            } catch (error) {
                console.error('Make move error:', error);
                socket.emit('error', { message: 'Failed to process move' });
            }
        });

        socket.on('resign', async (data) => {
            const { room_id } = data;
            try {
                const game = await Game.findOne({ room_id });
                if (!game || game.status === 'completed') return;

                console.log('Resign attempt:', { userId: socket.userId, room_id, whitePlayer: game.white_player, blackPlayer: game.black_player });

                const whitePlayerId = game.white_player?._id || game.white_player;
                const blackPlayerId = game.black_player?._id || game.black_player;

                const isWhiteResigning = whitePlayerId && whitePlayerId.toString() === socket.userId?.toString();
                const isBlackResigning = blackPlayerId && blackPlayerId.toString() === socket.userId?.toString();

                if (!isWhiteResigning && !isBlackResigning) {
                    console.log('User not in game or not authenticated');
                    return;
                }

                game.status = 'completed';
                game.termination_reason = 'resignation';
                game.result = isWhiteResigning ? 'black_win' : 'white_win';
                game.winner = isWhiteResigning ? blackPlayerId : whitePlayerId;
                game.completed_at = new Date();

                await game.save();

                const newRatings = await updateRatings(game);

                try {
                    const tournamentUpdate = await updateTournamentStandings(game._id);
                    if (tournamentUpdate) {
                        io.to(`tournament_${tournamentUpdate.tournamentId}`).emit('tournament_match_completed', {
                            match_id: tournamentUpdate.matchId,
                            result: game.result
                        });
                        io.to(`tournament_${tournamentUpdate.tournamentId}`).emit('tournament_leaderboard_update', {
                            tournament_id: tournamentUpdate.tournamentId
                        });
                    }
                } catch (err) {
                    console.error('Error updating tournament standings:', err);
                }

                console.log(`Broadcasting game_over to room: ${room_id}, result: ${game.result}`);

                io.to(room_id).emit('game_over', {
                    result: game.result,
                    reason: 'resignation',
                    winner: game.winner,
                    new_ratings: newRatings
                });

                const resigningUser = await User.findById(socket.userId);
                if (resigningUser) {
                    broadcastSystemMessage(io, room_id, `${resigningUser.username} resigned`);
                }

                if (abandonmentTimers.has(room_id)) {
                    clearTimeout(abandonmentTimers.get(room_id).timeout);
                    abandonmentTimers.delete(room_id);
                }

                console.log('Game over event emitted');
            } catch (error) {
                console.error('Resign error:', error);
            }
        });

        socket.on('offer_draw', async (data) => {
            const { room_id } = data;
            try {
                const sender = await User.findById(socket.userId);
                if (sender) {
                    broadcastSystemMessage(io, room_id, `${sender.username} offered a draw`);
                }
                socket.to(room_id).emit('draw_offered', { sender_id: socket.userId });
            } catch (error) {
                console.error('Offer draw error:', error);
            }
        });

        socket.on('accept_draw', async (data) => {
            const { room_id } = data;
            try {
                const game = await Game.findOne({ room_id });
                if (!game || game.status === 'completed') return;

                game.status = 'completed';
                game.result = 'draw';
                game.termination_reason = 'agreement';
                game.completed_at = new Date();

                await game.save();

                const newRatings = await updateRatings(game);

                try {
                    const tournamentUpdate = await updateTournamentStandings(game._id);
                    if (tournamentUpdate) {
                        io.to(`tournament_${tournamentUpdate.tournamentId}`).emit('tournament_match_completed', {
                            match_id: tournamentUpdate.matchId,
                            result: game.result
                        });
                        io.to(`tournament_${tournamentUpdate.tournamentId}`).emit('tournament_leaderboard_update', {
                            tournament_id: tournamentUpdate.tournamentId
                        });
                    }
                } catch (err) {
                    console.error('Error updating tournament standings:', err);
                }

                io.to(room_id).emit('game_over', {
                    result: 'draw',
                    reason: 'agreement',
                    new_ratings: newRatings
                });

                broadcastSystemMessage(io, room_id, 'Draw accepted by agreement');

                if (abandonmentTimers.has(room_id)) {
                    clearTimeout(abandonmentTimers.get(room_id).timeout);
                    abandonmentTimers.delete(room_id);
                }

            } catch (error) {
                console.error('Accept draw error:', error);
            }
        });

        socket.on('active_inactivity_start', (data) => {
            const { room_id } = data;
            socket.to(room_id).emit('opponent_inactivity_warning');
        });

        socket.on('active_inactivity_end', (data) => {
            const { room_id } = data;
            socket.to(room_id).emit('opponent_inactivity_canceled');
        });

        socket.on('send_chat_message', async (data) => {
            const { room_id, message } = data;
            try {
                const game = await Game.findOne({ room_id });
                if (!game) return;

                const whitePlayerId = game.white_player?._id || game.white_player;
                const blackPlayerId = game.black_player?._id || game.black_player;

                const isWhite = whitePlayerId && whitePlayerId.toString() === socket.userId?.toString();
                const isBlack = blackPlayerId && blackPlayerId.toString() === socket.userId?.toString();

                if (!isWhite && !isBlack) {
                    console.log('User is not a player in this game, cannot send chat messages');
                    return;
                }

                const sender = await User.findById(socket.userId);
                if (!sender) return;

                io.to(room_id).emit('chat_message', {
                    senderId: socket.userId.toString(),
                    senderName: sender.username,
                    text: message,
                    timestamp: new Date().toISOString(),
                    type: 'player'
                });
            } catch (error) {
                console.error('Send chat message error:', error);
            }
        });

        socket.on('client_game_abandoned', async (data) => {
            const { room_id } = data;
            try {
                const game = await Game.findOne({ room_id });
                if (!game || game.status !== 'active') return;

                const whitePlayerId = game.white_player?._id || game.white_player;
                const blackPlayerId = game.black_player?._id || game.black_player;

                const isWhite = whitePlayerId && whitePlayerId.toString() === socket.userId?.toString();
                const isBlack = blackPlayerId && blackPlayerId.toString() === socket.userId?.toString();

                if (!isWhite && !isBlack) return;

                game.status = 'completed';
                game.termination_reason = 'abandoned';
                game.result = isWhite ? 'black_win' : 'white_win';
                game.winner = isWhite ? blackPlayerId : whitePlayerId;
                game.completed_at = new Date();

                await game.save();

                const newRatings = await updateRatings(game);

                io.to(room_id).emit('game_over', {
                    result: game.result,
                    reason: 'abandoned',
                    winner: game.winner,
                    new_ratings: newRatings
                });

                const abandoningUser = await User.findById(socket.userId);
                if (abandoningUser) {
                    broadcastSystemMessage(io, room_id, `${abandoningUser.username} abandoned the game`);
                }

                if (abandonmentTimers.has(room_id)) {
                    clearTimeout(abandonmentTimers.get(room_id).timeout);
                    abandonmentTimers.delete(room_id);
                }

                console.log(`Game ${room_id} actively abandoned by user ${socket.userId} (inactivity)`);

            } catch (err) {
                console.error('Client game abandoned error:', err);
            }
        });

        socket.on('join_tournament_room', (data) => {
            const { tournament_id } = data;
            if (tournament_id) {
                socket.join(`tournament_${tournament_id}`);
                console.log(`✓ User ${socket.userId} joined tournament room: ${tournament_id}`);
            }
        });

        socket.on('leave_tournament_room', (data) => {
            const { tournament_id } = data;
            if (tournament_id) {
                socket.leave(`tournament_${tournament_id}`);
                console.log(`✓ User ${socket.userId} left tournament room: ${tournament_id}`);
            }
        });

        socket.on('disconnect', async () => {
            if (socket.userId) {

                const userId = socket.userId.toString();
                if (matchmakingQueue.has(userId)) {
                    matchmakingQueue.delete(userId);
                    console.log(`✓ User ${userId} removed from matchmaking queue (disconnected)`);
                }

                if (socket.isSpectator && socket.currentRoom) {
                    if (roomSpectators.has(socket.currentRoom)) {
                        roomSpectators.get(socket.currentRoom).delete(socket.userId.toString());
                        if (roomSpectators.get(socket.currentRoom).size === 0) {
                            roomSpectators.delete(socket.currentRoom);
                        }
                    }
                }

                await User.findByIdAndUpdate(socket.userId, { status: 'offline', last_seen: new Date() });
                await broadcastStatusToFriends(io, socket.userId, 'offline');

                if (socket.currentRoom && !socket.isSpectator) {
                    try {
                        const game = await Game.findOne({ room_id: socket.currentRoom });

                        if (game && game.status === 'active') {
                            const whitePlayerId = game.white_player?._id || game.white_player;
                            const blackPlayerId = game.black_player?._id || game.black_player;

                            const isWhite = whitePlayerId && whitePlayerId.toString() === socket.userId.toString();
                            const isBlack = blackPlayerId && blackPlayerId.toString() === socket.userId.toString();

                            if (isWhite || isBlack) {
                                const roomId = socket.currentRoom;
                                const userId = socket.userId;

                                if (abandonmentTimers.has(roomId)) {
                                    clearTimeout(abandonmentTimers.get(roomId).timeout);
                                }

                                console.log(`Starting abandonment timer for room ${roomId}, user ${userId}`);
                                const timeout = setTimeout(async () => {
                                    try {
                                        const gameToCheck = await Game.findOne({ room_id: roomId });
                                        if (gameToCheck && gameToCheck.status === 'active') {
                                            gameToCheck.status = 'completed';
                                            gameToCheck.termination_reason = 'abandoned';
                                            gameToCheck.result = isWhite ? 'black_win' : 'white_win';
                                            gameToCheck.winner = isWhite ? blackPlayerId : whitePlayerId;
                                            gameToCheck.completed_at = new Date();

                                            await gameToCheck.save();

                                            const newRatings = await updateRatings(gameToCheck);

                                            io.to(roomId).emit('game_over', {
                                                result: gameToCheck.result,
                                                reason: 'abandoned',
                                                winner: gameToCheck.winner,
                                                new_ratings: newRatings
                                            });
                                            console.log(`Game ${roomId} abandoned by ${userId}`);
                                        }
                                        abandonmentTimers.delete(roomId);
                                    } catch (err) {
                                        console.error('Abandonment timeout error:', err);
                                    }
                                }, 30000);

                                abandonmentTimers.set(roomId, { timeout, userId });

                                io.to(roomId).emit('abandonment_warning', {
                                    player_color: isWhite ? 'white' : 'black',
                                    seconds_remaining: 30
                                });
                            }
                        }
                    } catch (error) {
                        console.error('Disconnect error:', error);
                    }
                }
            }
        });
    });
}

module.exports = registerGameSocket;

