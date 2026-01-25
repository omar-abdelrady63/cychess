# ♟️ CyChess

A modern, real-time chess platform built for playing with friends. Create games, challenge opponents, and track your chess journey—all in a sleek, customizable interface.

## ✨ Features

- **Real-time Multiplayer** - Instant move synchronization using WebSocket technology
- **Friend System** - Add friends, send invites, and manage your chess network
- **Flexible Time Controls** - Choose from 1, 3, 5, 10, 30, or 60-minute games
- **Move Review** - Click through game history to analyze every position
- **15 Unique Themes** - Personalize your board with beautiful color schemes
- **Sound Effects** - Immersive audio for moves, captures, checks, and game endings
- **PGN Export** - Download games for analysis on other platforms
- **User Profiles** - Custom avatars and personalized settings
- **Game History** - Track all your past matches and results

## 🛠️ Tech Stack

<div align="center">

![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)

</div>

**Frontend:**
- React 18 with Hooks
- React Router for navigation
- Vite for blazing-fast development
- CSS3 with CSS Variables for theming
- react-chessboard for board rendering
- chess.js for game logic

**Backend:**
- Node.js & Express.js REST API
- Socket.IO for real-time communication
- MongoDB with Mongoose ODM
- JWT authentication
- bcrypt for password hashing

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v5 or higher) - [Download](https://www.mongodb.com/try/download/community) or use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- **npm** or **yarn** package manager
```bash
git clone https://github.com/omar-abdelrady63/cychess.git
cd cychess
```

Install root dependencies (if any):
```bash
npm install
```

Install server dependencies:
```bash
cd server
npm install
```

Install client dependencies:
```bash
cd ../client
npm install
```


### 3. Database Setup

If using local MongoDB, ensure the MongoDB service is running:

```bash
# Windows
net start MongoDB

# macOS (via Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

The application will automatically create the database and collections on first run.

## 🎮 Running the Application

### Development Mode

Open two terminal windows:

**Terminal 1 - Start the backend server:**
```bash
cd server
npm run dev
```
Server will run on `http://localhost:5000`

**Terminal 2 - Start the frontend:**
```bash
cd client
npm run dev
```
Client will run on `http://localhost:5173`

### Production Build

Build the client:
```bash
cd client
npm run build
```

Start the production server:
```bash
cd server
npm start
```

## 📁 Project Structure

```
cychess/
├── client/                 # React frontend
│   ├── public/            # Static assets (sounds, images)
│   ├── src/
│   │   ├── components/    # Reusable React components
│   │   ├── context/       # React Context (Auth, Socket, Theme)
│   │   ├── pages/         # Page components (Dashboard, Game, etc.)
│   │   ├── styles/        # CSS files and themes
│   │   └── main.jsx       # App entry point
│   └── package.json
│
├── server/                # Node.js backend
│   ├── config/           # Configuration files
│   ├── controllers/      # Route controllers
│   ├── middleware/       # Custom middleware (auth, etc.)
│   ├── models/           # Mongoose models
│   ├── routes/           # Express routes
│   ├── sockets/          # Socket.IO event handlers
│   ├── utils/            # Helper functions
│   └── server.js         # Server entry point
│
└── README.md
```

## 🎨 Available Themes

Choose from 15 carefully crafted themes:

- Deep Navy (Default)
- Black & Gold
- Grey & Beige
- Purple & Silver
- Crimson Shadow
- Emerald City
- Royal Blue
- Sunset Horizon
- Neon Nights
- Ocean Breeze
- Amber Glow
- Lavender Dreams
- **Midnight Forest** ✨ NEW
- **Cherry Blossom** ✨ NEW
- **Arctic Frost** ✨ NEW

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure your code follows the existing style and includes appropriate tests.


## 📧 Contact

For questions, suggestions, or issues, please contact me on my social media (found in portfolio and github account).

---

**All rights reserved to Omar Abd-Elrady.**