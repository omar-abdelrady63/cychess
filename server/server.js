const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');
const registerGameSocket = require('./sockets/gameSocket');

const authRoutes = require('./routes/auth');
const friendsRoutes = require('./routes/friends');
const gameRoutes = require('./routes/game');
const notificationsRoutes = require('./routes/notifications');

const app = express();
const server = http.createServer(app);

const corsOptions = {
    origin: process.env.CLIENT_URL || 'https://cychess.vercel.app',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

const io = new Server(server, {
    cors: corsOptions,
    transports: ['websocket', 'polling']
});

app.set('io', io);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/friends', friendsRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/notifications', notificationsRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'CyChess API is running' });
});

app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

registerGameSocket(io);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();

        server.listen(PORT, '0.0.0.0', () => {
            console.log('='.repeat(60));
            console.log('CyChess Server Started Successfully');
            console.log('='.repeat(60));
            console.log(`Server running on port ${PORT}`);
            console.log(`Client URL: ${corsOptions.origin}`);
            console.log('='.repeat(60));
        });
    } catch (error) {
        console.error('Failed to connect to Database. Server not started.');
        console.error(error);
        process.exit(1);
    }
};

startServer();

module.exports = { app, server, io };