const mongoose = require('mongoose');

const tournamentParticipantSchema = new mongoose.Schema({
    tournament_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tournament',
        required: true,
        index: true
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    total_points: {
        type: Number,
        default: 0
    },
    wins: {
        type: Number,
        default: 0
    },
    draws: {
        type: Number,
        default: 0
    },
    losses: {
        type: Number,
        default: 0
    },
    has_bye: {
        type: Boolean,
        default: false
    },
    joined_at: {
        type: Date,
        default: Date.now
    }
});

tournamentParticipantSchema.index({ tournament_id: 1, user_id: 1 }, { unique: true });

const TournamentParticipant = mongoose.model('TournamentParticipant', tournamentParticipantSchema);

module.exports = TournamentParticipant;
