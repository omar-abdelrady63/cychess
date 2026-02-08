const mongoose = require('mongoose');

const tournamentMatchSchema = new mongoose.Schema({
    tournament_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tournament',
        required: true,
        index: true
    },
    round_number: {
        type: Number,
        required: true
    },
    game_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Game'
    },
    white_participant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TournamentParticipant',
        required: true
    },
    black_participant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TournamentParticipant'
    },
    is_bye: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['pending', 'active', 'completed'],
        default: 'pending'
    },
    result: {
        type: String,
        enum: ['white_win', 'black_win', 'draw', null],
        default: null
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    completed_at: {
        type: Date
    }
});

tournamentMatchSchema.index({ tournament_id: 1, round_number: 1 });

const TournamentMatch = mongoose.model('TournamentMatch', tournamentMatchSchema);

module.exports = TournamentMatch;
