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

// 1. إعدادات الـ CORS الموحدة
const corsOptions = {
    origin: process.env.CLIENT_URL || 'https://cychess.vercel.app',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};

// 2. تفعيل الـ CORS كأول خطوة في الـ Middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // للرد على طلبات الـ Preflight

// 3. إعداد السوكيت بنفس الإعدادات
const io = new Server(server, {
    cors: corsOptions,
    transports: ['websocket', 'polling']
});

app.set('io', io);

// 4. الـ Middlewares الأساسية
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 5. تعريف الـ Routes بعد الـ CORS
app.use('/api/auth', authRoutes);
app.use('/api/friends', friendsRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/notifications', notificationsRoutes);

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'CyChess API is running' });
});

// Error Handling
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

registerGameSocket(io);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();

        // الـ Listen لازم يكون على 0.0.0.0 عشان المنصات السحابية
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