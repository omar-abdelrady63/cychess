const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        index: true,
        trim: true
    },
    discriminator: {
        type: String,
        required: true,
        length: 6,
        match: /^[a-zA-Z0-9]{6}$/
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password_hash: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        default: 1200,
        index: true
    },
    avatar: {
        type: String,
        default: ''
    },
    game_stats: {
        wins: { type: Number, default: 0 },
        losses: { type: Number, default: 0 },
        draws: { type: Number, default: 0 }
    },
    // ---------------------------------------
    is_verified: {
        type: Boolean,
        default: false
    },
    verification_code: {
        type: String
    },
    status: {
        type: String,
        enum: ['online', 'offline', 'in_game', 'spectating'],
        default: 'offline'
    },
    last_seen: {
        type: Date,
        default: Date.now
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    blockedUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
});

userSchema.index({ username: 1, discriminator: 1 }, { unique: true });

userSchema.virtual('full_name').get(function () {
    return `${this.username}#${this.discriminator}`;
});

userSchema.virtual('is_online').get(function () {
    return this.status === 'online' || this.status === 'in_game' || this.status === 'spectating';
});

userSchema.methods.setPassword = async function (password) {
    this.password_hash = await bcrypt.hash(password, 10);
};

userSchema.methods.checkPassword = async function (password) {
    return await bcrypt.compare(password, this.password_hash);
};

userSchema.methods.generateVerificationCode = function () {
    this.verification_code = Math.floor(100000 + Math.random() * 900000).toString();
    return this.verification_code;
};

userSchema.statics.generateDiscriminator = async function (username) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let discriminator;
    let attempts = 0;
    const maxAttempts = 100;

    do {
        discriminator = '';
        for (let i = 0; i < 6; i++) {
            discriminator += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        attempts++;

        if (attempts >= maxAttempts) {
            throw new Error('Failed to generate unique discriminator');
        }
    } while (await this.findOne({ username, discriminator }));

    return discriminator;
};

userSchema.methods.getFriends = async function () {
    const FriendRequest = mongoose.models.FriendRequest || mongoose.model('FriendRequest');

    const sent = await FriendRequest.find({
        sender: this._id,
        status: 'accepted'
    }).populate('receiver', 'username discriminator avatar is_online rating');

    const received = await FriendRequest.find({
        receiver: this._id,
        status: 'accepted'
    }).populate('sender', 'username discriminator avatar is_online rating');

    const friends = [
        ...sent.map(req => req.receiver),
        ...received.map(req => req.sender)
    ].filter(friend => friend != null);

    return friends;
};
const User = mongoose.model('User', userSchema);

module.exports = User;