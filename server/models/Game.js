const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
    room_id: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    white_player: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    black_player: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    pgn: {
        type: String,
        default: ''
    },
    fen: {
        type: String,
        default: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    },
    status: {
        type: String,
        enum: ['waiting', 'active', 'completed'],
        default: 'waiting'
    },
    result: {
        type: String,
        enum: ['white_win', 'black_win', 'draw', null],
        default: null
    },
    termination_reason: {
        type: String,
        enum: [
            'checkmate',
            'stalemate',
            'insufficient_material',
            'threefold_repetition',
            'agreement',
            'draw_agreement',
            'resignation',
            'timeout',
            'abandoned',
            null
        ],
        default: null
    },
    winner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    moves: [{
        from: String,
        to: String,
        color: String,
        piece: String,
        san: String,
        fen_after: String,
        timestamp: { type: Date, default: Date.now }
    }],
    time_control: {
        initial: { type: Number, default: 600 },
        increment: { type: Number, default: 0 }
    },
    white_time: {
        type: Number,
        default: 600
    },
    black_time: {
        type: Number,
        default: 600
    },
    last_move_time: {
        type: Date,
        default: null
    },
    current_turn: {
        type: String,
        enum: ['white', 'black'],
        default: 'white'
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    completed_at: {
        type: Date
    }
});

const Game = mongoose.model('Game', gameSchema);

module.exports = Game;