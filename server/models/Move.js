const mongoose = require('mongoose');

const moveSchema = new mongoose.Schema({
    game: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Game',
        required: true,
        index: true
    },
    move_number: {
        type: Number,
        required: true
    },
    move_san: {
        type: String,
        required: true
    },
    move_uci: {
        type: String,
        required: true
    },
    fen_after: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const Move = mongoose.model('Move', moveSchema);

module.exports = Move;
