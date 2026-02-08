const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const FriendRequest = require('../models/FriendRequest');
const Notification = require('../models/Notification');

router.get('/search', auth, async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || q.length < 2) {
            return res.json({ users: [] });
        }

        let users;

        if (q.includes('#')) {
            const [username, discriminator] = q.split('#');
            users = await User.find({
                username: new RegExp(username, 'i'),
                discriminator: discriminator,
                _id: { $ne: req.userId },
                is_verified: true
            }).limit(10).select('-password_hash -verification_code');
        } else {
            users = await User.find({
                username: new RegExp(q, 'i'),
                _id: { $ne: req.userId },
                is_verified: true
            }).limit(10).select('-password_hash -verification_code');
        }

        const results = await Promise.all(users.map(async (user) => {
            const existingRequest = await FriendRequest.findOne({
                $or: [
                    { sender: req.userId, receiver: user._id },
                    { sender: user._id, receiver: req.userId }
                ]
            });

            let status = 'none';
            if (existingRequest) {
                if (existingRequest.status === 'accepted') {
                    status = 'friends';
                } else if (existingRequest.sender.toString() === req.userId.toString()) {
                    status = 'sent';
                } else {
                    status = 'received';
                }
            }

            return {
                id: user._id,
                username: user.username,
                discriminator: user.discriminator,
                full_name: user.full_name,
                is_online: user.is_online,
                status: user.status,
                rating: user.rating,
                friend_status: status
            };
        }));

        res.json({ users: results });

    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/send-request', auth, async (req, res) => {
    try {
        const { receiver_id } = req.body;

        if (!receiver_id) {
            return res.status(400).json({ error: 'Receiver ID required' });
        }

        if (receiver_id === req.userId.toString()) {
            return res.status(400).json({ error: 'Cannot send request to yourself' });
        }

        const receiver = await User.findById(receiver_id);
        if (!receiver) {
            return res.status(404).json({ error: 'User not found' });
        }

        const existing = await FriendRequest.findOne({
            $or: [
                { sender: req.userId, receiver: receiver_id },
                { sender: receiver_id, receiver: req.userId }
            ]
        });

        if (existing) {
            return res.status(400).json({ error: 'Request already exists' });
        }

        const friendRequest = new FriendRequest({
            sender: req.userId,
            receiver: receiver_id
        });
        await friendRequest.save();
        const notification = new Notification({
            user: receiver_id,
            type: 'friend_request',
            title: 'Friend Request',
            message: `${req.user.username} sent you a friend request`,
            data: {
                sender_id: req.userId,
                sender_username: req.user.username,
                request_id: friendRequest._id
            }
        });
        await notification.save();

        req.app.get('io').to(`user_${receiver_id}`).emit('new_notification', {
            id: notification._id,
            type: 'friend_request',
            title: 'Friend Request',
            message: `${req.user.username} sent you a friend request`,
            data: notification.data
        });

        res.json({ success: true, message: 'Friend request sent' });

    } catch (error) {
        console.error('Send request error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/accept/:id', auth, async (req, res) => {
    try {
        const friendRequest = await FriendRequest.findById(req.params.id);

        if (!friendRequest) {
            return res.status(404).json({ error: 'Request not found' });
        }

        if (friendRequest.receiver.toString() !== req.userId.toString()) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        friendRequest.status = 'accepted';
        await friendRequest.save();

        const notification = new Notification({
            user: friendRequest.sender,
            type: 'request_accepted',
            title: 'Friend Request Accepted',
            message: `${req.user.username} accepted your friend request`,
            data: { accepter_id: req.userId }
        });
        await notification.save();

        const io = req.app.get('io');
        io.to(`user_${friendRequest.sender}`).emit('new_notification', {
            id: notification._id,
            type: 'request_accepted',
            title: 'Friend Request Accepted',
            message: `${req.user.username} accepted your friend request`
        });
        io.to(`user_${friendRequest.sender}`).emit('friend_list_update');
        io.to(`user_${req.userId}`).emit('friend_list_update');

        res.json({ success: true, message: 'Friend request accepted' });

    } catch (error) {
        console.error('Accept request error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/reject/:id', auth, async (req, res) => {
    try {
        const friendRequest = await FriendRequest.findById(req.params.id);

        if (!friendRequest) {
            return res.status(404).json({ error: 'Request not found' });
        }

        if (friendRequest.receiver.toString() !== req.userId.toString()) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        friendRequest.status = 'rejected';
        await friendRequest.save();

        res.json({ success: true, message: 'Friend request rejected' });

    } catch (error) {
        console.error('Reject request error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/', auth, async (req, res) => {
    try {
        const friends = await req.user.getFriends();

        const friendsData = friends.map(friend => ({
            id: friend._id,
            username: friend.username,
            discriminator: friend.discriminator,
            full_name: friend.full_name,
            is_online: friend.is_online,
            status: friend.status,
            rating: friend.rating
        }));

        res.json({ friends: friendsData });

    } catch (error) {
        console.error('Get friends error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/pending', auth, async (req, res) => {
    try {
        const requests = await FriendRequest.find({
            receiver: req.userId,
            status: 'pending'
        }).populate('sender', '-password_hash -verification_code');

        const requestsData = requests.map(req => ({
            id: req._id,
            sender_id: req.sender._id,
            sender_username: req.sender.username,
            sender_discriminator: req.sender.discriminator,
            sender_full_name: req.sender.full_name
        }));

        res.json({ requests: requestsData });

    } catch (error) {
        console.error('Get pending requests error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.delete('/delete/:id', auth, async (req, res) => {
    try {
        const friendId = req.params.id;

        await FriendRequest.deleteMany({
            $or: [
                { sender: req.userId, receiver: friendId, status: 'accepted' },
                { sender: friendId, receiver: req.userId, status: 'accepted' }
            ]
        });

        res.json({ success: true, message: 'Friend deleted' });

    } catch (error) {
        console.error('Delete friend error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/block/:id', auth, async (req, res) => {
    try {
        const userToBlockId = req.params.id;

        if (userToBlockId === req.userId) {
            return res.status(400).json({ error: 'Cannot block yourself' });
        }

        const user = await User.findById(req.userId);
        if (user.blockedUsers.includes(userToBlockId)) {
            return res.status(400).json({ error: 'User already blocked' });
        }

        user.blockedUsers.push(userToBlockId);

        await FriendRequest.deleteMany({
            $or: [
                { sender: req.userId, receiver: userToBlockId },
                { sender: userToBlockId, receiver: req.userId }
            ]
        });

        await user.save();
        res.json({ success: true, message: 'User blocked' });

    } catch (error) {
        console.error('Block error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/unblock/:id', auth, async (req, res) => {
    try {
        const userToUnblockId = req.params.id;
        const user = await User.findById(req.userId);

        user.blockedUsers = user.blockedUsers.filter(
            id => id.toString() !== userToUnblockId
        );

        await user.save();
        res.json({ success: true, message: 'User unblocked' });

    } catch (error) {
        console.error('Unblock error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/blocked', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId).populate('blockedUsers', 'username discriminator avatar');
        res.json({ blocked: user.blockedUsers || [] });
    } catch (error) {
        console.error('Get blocked error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
