const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    type: {
        type: String,
        required: true,
        enum: ['friend_request', 'request_accepted', 'game_invite', 'game_started', 'game_ended']
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    data: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    is_read: {
        type: Boolean,
        default: false
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

notificationSchema.index({ user: 1, is_read: 1 });
notificationSchema.index({ created_at: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
