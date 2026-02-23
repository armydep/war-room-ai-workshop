import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';

import { initializeSchema } from './db/schema';
import { requestLogger } from './middleware/logger';
import { errorHandler } from './middleware/errorHandler';
import incidentRoutes from './routes/incidents';
import analyticsRoutes from './routes/analytics';
import alertRoutes from './routes/alerts';

const app = express();
const server = http.createServer(app);
const PORT = 3001;

const io = new SocketIOServer(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3001'],
    methods: ['GET', 'POST', 'PATCH'],
  },
});

app.set('io', io);

app.use(cors());
app.use(express.json());
app.use(requestLogger);

app.use(express.static(path.join(__dirname, '../public')));

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    data: { status: 'ok', message: 'WarRoom server is running' },
    meta: { timestamp: new Date().toISOString() },
  });
});

app.use('/api', incidentRoutes);
app.use('/api', analyticsRoutes);
app.use('/api', alertRoutes);

app.use(errorHandler);

io.on('connection', (socket) => {
  console.info(`[${new Date().toISOString()}] [INFO] [websocket] Client connected: ${socket.id}`);

  socket.on('disconnect', (reason) => {
    console.info(`[${new Date().toISOString()}] [INFO] [websocket] Client disconnected: ${socket.id} (${reason})`);
  });
});

initializeSchema();

server.listen(PORT, () => {
  console.log(`\n  WarRoom server ready at http://localhost:${PORT}`);
  console.log(`  WebSocket server listening on port ${PORT}\n`);
});
