const mongoose = require('mongoose');

const tournamentSchema = new mongoose.Schema({
    tournament_id: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    admin_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rounds_count: {
        type: Number,
        required: true,
        min: 1,
        max: 20
    },
    current_round: {
        type: Number,
        default: 0
    },
    time_control: {
        initial: { type: Number, required: true },
        increment: { type: Number, default: 0 }
    },
    is_ranked: {
        type: Boolean,
        default: true
    },
    status: {
        type: String,
        enum: ['waiting', 'active', 'completed'],
        default: 'waiting'
    },
    invite_link: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    started_at: {
        type: Date
    },
    completed_at: {
        type: Date
    }
});

const Tournament = mongoose.model('Tournament', tournamentSchema);

module.exports = Tournament;
