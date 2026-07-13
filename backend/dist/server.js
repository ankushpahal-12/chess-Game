"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const app_1 = __importDefault(require("./app"));
const db_1 = require("./config/db");
const socketHandler_1 = require("./socket/socketHandler");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const PORT = process.env.PORT || 5000;
// Connect to MongoDB
(0, db_1.connectDB)().then(() => {
    // Create HTTP Server
    const server = http_1.default.createServer(app_1.default);
    // Initialize Socket.IO Server with CORS configured
    const io = new socket_io_1.Server(server, {
        cors: {
            origin: '*', // Allow all origins for dev simplicity, can narrow down in production
            methods: ['GET', 'POST']
        }
    });
    // Setup Socket Listeners
    (0, socketHandler_1.setupSocket)(io);
    // Start listening
    server.listen(PORT, () => {
        console.log(`Server running in development mode on port ${PORT}`);
    });
}).catch((error) => {
    console.error('Failed to connect to database. Server startup aborted.', error);
});
