import http from 'http';
import { Server } from 'socket.io';
import app from './app';
import { connectDB } from './config/db';
import { setupSocket } from './socket/socketHandler';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB().then(() => {
  // Create HTTP Server
  const server = http.createServer(app);

  // Initialize Socket.IO Server with CORS configured
  const io = new Server(server, {
    cors: {
      origin: '*', // Allow all origins for dev simplicity, can narrow down in production
      methods: ['GET', 'POST']
    }
  });

  // Setup Socket Listeners
  setupSocket(io);

  // Start listening
  server.listen(PORT, () => {
    console.log(`Server running in development mode on port ${PORT}`);
  });
}).catch((error) => {
  console.error('Failed to connect to database. Server startup aborted.', error);
});
