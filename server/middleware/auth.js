const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ error: 'No authentication token, access denied' });
        }

        const decoded = jwt.verify(token, process.env.SECRET_KEY);

        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({ error: 'Token is not valid' });
        }

        req.user = user;
        req.userId = user._id;

        next();
    } catch (error) {
        res.status(401).json({ error: 'Token is not valid' });
    }
};

module.exports = auth;
