// Add this at the top of your server.js
process.removeAllListeners('warning');

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import userRoutes from './routes/userRoutes.js';
import disasterRoutes from './routes/disasterRoutes.js';
import externalDataRoutes from './routes/externalDataRoutes.js';
import authRoutes from './routes/authRoutes.js';
import { startDataCollection } from './services/dataCollector.js';
import userSettingsRoutes from './routes/userSettings.js';
import indexRoutes from './routes/indexRoutes.js';
// Change this line
import { startAlertChecker } from './utils/alertChecker.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
console.log('Uploads directory path:', uploadsDir);

console.log('Starting server initialization...');

dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const httpServer = createServer(app);

// Move static file serving to the top, before API routes
app.use(express.static(path.join(__dirname, '../frontend/build')));

app.use(cors({
  origin: ['http://localhost:5174', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true
}));

export const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5174', 'http://localhost:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

app.use((req, res, next) => {
  console.log('--------------------');
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log('Headers:', req.headers);
  console.log('Query:', req.query);
  console.log('Body:', req.body);
  console.log('--------------------');
  next();
});

app.use(express.json({
  limit: '50mb',
  verify: (req, res, buf, encoding) => {
    if (req.method === 'GET' || !buf.length) {
      return;
    }
    try {
      JSON.parse(buf);
    } catch (e) {
      console.error('JSON Parse Error:', e);
      res.status(400).json({
        status: 'error',
        message: 'Invalid JSON payload',
        details: e.message
      });
      throw new Error('Invalid JSON');
    }
  }
}));

app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// After your middleware setup
app.use('/uploads', express.static(uploadsDir));

// Remove the specific image and video routes since we're serving directly from uploads
app.get('/api/disasters/image/:filename', (req, res) => {
  const imagePath = path.join(uploadsDir, 'images', req.params.filename);
  console.log('Serving image:', imagePath);
  if (!fs.existsSync(imagePath)) {
    console.error('Image not found:', imagePath);
    return res.status(404).send('Image not found');
  }
  res.sendFile(imagePath);
});

app.get('/api/disasters/video/:filename', (req, res) => {
  const videoPath = path.join(uploadsDir, 'videos', req.params.filename);
  console.log('Serving video:', videoPath);
  if (!fs.existsSync(videoPath)) {
    console.error('Video not found:', videoPath);
    return res.status(404).send('Video not found');
  }
  res.sendFile(videoPath);
});

// Remove the duplicate route definitions at the bottom of the file
console.log('Registering routes...');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users/settings', userSettingsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/disasters', disasterRoutes);
app.use('/api/externaldatas', externalDataRoutes);
app.use('/', indexRoutes);

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

app.use((err, req, res, next) => {
  console.error('Error Details:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid JSON payload',
      details: err.message
    });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      status: 'error',
      message: 'Validation Error',
      details: Object.values(err.errors).map(e => e.message)
    });
  }

  res.status(500).json({
    status: 'error',
    message: 'Internal Server Error',
    details: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

console.log('Connecting to MongoDB...');

connectDB().then(() => {
  console.log('MongoDB Connected successfully');
  startDataCollection();
}).catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('error', (error) => {
    console.error('Socket.IO Error:', error);
  });

  socket.on('disconnect', (reason) => {
    console.log('Client disconnected:', socket.id, 'Reason:', reason);
  });
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  io.close(() => {
    process.exit(1);
  });
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  startAlertChecker();
});