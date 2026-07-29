import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Configurations & Services
import connectDB from './config/db.js';
import socketHandler from './sockets/socketHandler.js';

// Route Handlers
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import listingRoutes from './routes/listingRoutes.js';
import swapRoutes from './routes/swapRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import errorHandler from './middleware/errorMiddleware.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Serve local uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const httpServer = createServer(app);

// Socket.IO Server Setup
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Bind Socket actions
socketHandler(io);

// Connect Mongoose Database
connectDB();

// Security Middlewares
app.use(helmet());

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// Express limits rate to protect API
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api/', limiter);

// Express Parsers
app.use(express.json({ limit: '10mb' })); // support large base64 uploads for Gemini Vision
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware for debugging API calls
app.use((req, res, next) => {
  const logMsg = `[API REQUEST] ${req.method} ${req.url} - ${new Date().toISOString()}\n`;
  try {
    fs.appendFileSync(path.join(__dirname, 'debug.log'), logMsg);
  } catch (err) {}
  console.log(`[API REQUEST] ${req.method} ${req.url}`);
  if (req.method === 'POST' || req.method === 'PUT') {
    const bodyCopy = { ...req.body };
    if (bodyCopy.password) bodyCopy.password = '••••••••';
    if (bodyCopy.imageBase64) bodyCopy.imageBase64 = '[BASE64_IMAGE_DATA_TRUNCATED]';
    console.log(`[API BODY]`, bodyCopy);
  }
  next();
});

// Custom lightweight Cookie Parser Middleware
app.use((req, res, next) => {
  req.cookies = {};
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    cookieHeader.split(';').forEach(cookie => {
      const parts = cookie.split('=');
      req.cookies[parts[0].trim()] = (parts[1] || '').trim();
    });
  }
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/swaps', swapRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);

// Mock home check
app.get('/', (req, res) => {
  res.json({ message: 'ReWear API Server is running!' });
});

// Express Error Handler Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
