import http from 'http';
import { Server } from 'socket.io';
import app from './app';
import { connectDB } from './config/db';
import { setupSocket } from './socket/socketHandler';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;

// Create HTTP server and Socket.IO immediately — do NOT wait for DB
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

setupSocket(io);

// Start listening right away so the frontend never gets ERR_CONNECTION_REFUSED
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Connect to MongoDB in the background — server stays up even if this fails
connectDB().catch((error) => {
  console.error('MongoDB connection failed. Server is running but DB features are unavailable.', error);
});
