const { Chess } = require('chess.js');
const Game = require('../models/Game');
const User = require('../models/User');

function registerGameSocket(io) {
    io.on('connection', (socket) => {
        console.log(` User connected: ${socket.id}`);

        socket.on('authenticate', async (data) => {
            const { userId } = data;
            if (userId) {
                socket.userId = userId;
                socket.join(`user_${userId}`);
                await User.findByIdAndUpdate(userId, { is_online: true });
                console.log(` User ${userId} authenticated`);
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

            } catch (error) {
                console.error('Join error:', error);
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
                // -----------------------------------------------

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
                    io.to(room_id).emit('game_over', {
                        result: game.result,
                        reason: 'timeout',
                        winner: game.winner
                    });
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
                    else game.termination_reason = 'draw'; // 50-move rule
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

                io.to(room_id).emit('move_made', {
                    move: move.from + move.to + (move.promotion || ''),
                    san: move.san,
                    fen: game.fen,
                    white_time: game.white_time,
                    black_time: game.black_time,
                    current_turn: game.current_turn,
                    game_status: game.status,
                    result: game.result,
                    termination_reason: game.termination_reason
                });

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

                console.log(`Broadcasting game_over to room: ${room_id}, result: ${game.result}`);

                io.to(room_id).emit('game_over', {
                    result: game.result,
                    reason: 'resignation',
                    winner: game.winner
                });

                console.log('Game over event emitted');
            } catch (error) {
                console.error('Resign error:', error);
            }
        });

        socket.on('offer_draw', async (data) => {
            const { room_id } = data;
            try {
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

                io.to(room_id).emit('game_over', {
                    result: 'draw',
                    reason: 'agreement'
                });

            } catch (error) {
                console.error('Accept draw error:', error);
            }
        });

        socket.on('disconnect', async () => {
            if (socket.userId) {
                await User.findByIdAndUpdate(socket.userId, { is_online: false, last_seen: new Date() });

                if (socket.currentRoom) {
                    try {
                        const game = await Game.findOne({ room_id: socket.currentRoom });
                        if (game && game.status === 'active') {
                            const whitePlayerId = game.white_player?._id || game.white_player;
                            const blackPlayerId = game.black_player?._id || game.black_player;

                            const isWhite = whitePlayerId && whitePlayerId.toString() === socket.userId.toString();
                            const isBlack = blackPlayerId && blackPlayerId.toString() === socket.userId.toString();

                            if (isWhite || isBlack) {
                                game.status = 'completed';
                                game.termination_reason = 'abandoned';
                                game.result = isWhite ? 'black_win' : 'white_win';
                                game.winner = isWhite ? blackPlayerId : whitePlayerId;
                                game.completed_at = new Date();

                                await game.save();

                                io.to(socket.currentRoom).emit('game_over', {
                                    result: game.result,
                                    reason: 'abandoned',
                                    winner: game.winner
                                });
                            }
                        }
                    } catch (error) {
                        console.error('Auto-resign on disconnect error:', error);
                    }
                }
            }
        });
    });
}

module.exports = registerGameSocket;
