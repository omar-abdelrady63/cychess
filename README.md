# ♟️ CyChess

A modern, real-time chess platform built for playing with friends. Create games, challenge opponents, and track your chess journey—all in a sleek, customizable interface.

## 🛠️ Tech Stack

<div align="center">

![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

</div>

## ✨ Features

- **Real-time Multiplayer** - Instant move synchronization using WebSocket technology.
- **Analysis Mode** - Analyze your games with the integrated Stockfish 16 engine.
- **Friend System** - Add friends, send invites, and see their online status.
- **Tournaments** - Create and participate in chess tournaments.
- **Flexible Time Controls** - Ranging from Bullet (1 min) to Classical (60 mins).
- **15 Unique Themes** - Customize your board with beautiful, polished themes.
- **Game History** - Review past games and export generic PGNs.
- **Responsive Design** - Optimized for desktop, tablet, and mobile play.

## 📁 Project Structure

```
cychess/
├── client/                 # React Frontend
│   ├── public/             
│   └── src/
│       ├── components/     # UI Components (Board, Modal, diverse widgets)
│       ├── context/        # State Management (Auth, Socket, Theme)
│       ├── pages/          # Main Views (Game, Dashboard, Profile)
│       └── styles/         # Global CSS & Tailwind config
│
├── server/                 # Node.js Backend
│   ├── config/             # DB Connection & Environment Config
│   ├── controllers/        # Request Handlers
│   ├── models/             # Database Schemas (User, Game, etc.)
│   ├── routes/             # API Route Definitions
│   └── sockets/            # Real-time Event Logic
│
└── README.md
```

## 📅 Project Evolution Timeline

<div align="center">

| Version | Status | Description |
|:---:|:---:|:---|
| **v1.0** | 🔴 Legacy | **Initial Prototype**<br>Values: Simple Flask app (Python).<br>Details: Basic chess logic, HTML/CSS frontend, no real-time features. |
| **v2.0** | 🟡 Past | **The MERN Rewrite**<br>Values: Scalability & Real-time.<br>Details: Complete refactor to MERN stack. Added user auth, Socket.io for live moves, and MongoDB integration. |
| **v3.0** | 🟢 Stable | **Feature Expansion**<br>Values: Community & Experience.<br>Details: Friend system implementation, 15+ themes, sound effects, responsive UI improvements. |
| **v4.0** | 🚀 **Current** | **The "Glass" Era & Intelligence** (Last 5 Days)<br>Details:<br>• **Glassmorphism UI**: Complete visual overhaul with premium glass effects.<br>• **Stockfish Integration**: Added browser-based engine analysis (WASM).<br>• **Tournament Mode**: New system for organized competitive play.<br>• **Performance**: Optimized rendering and WebSocket handling.<br>• **Security**: Enhanced COOP/COEP headers for SharedArrayBuffer support. |

</div>

<br>

<div align="center">
  <h3>● ─── ● ─── ● ─── ◉</h3>
</div>

## 📧 Contact

**Omar Abd-Elrady**

- **GitHub**: [omar-abdelrady63](https://github.com/omar-abdelrady63)
- **Email**: [Contact me via GitHub]
- **Portfolio**: [Link to Portfolio]

---

**All rights reserved © 2026**