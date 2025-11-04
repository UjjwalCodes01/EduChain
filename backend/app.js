require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { apiLimiter } = require('./middleware/rateLimiter');
const { initIPFS } = require('./utils/ipfs');
const { initEmailTransporter } = require('./utils/email');

// Import routes
const applicationRoutes = require('./routes/applicationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const onboardingRoutes = require('./routes/onboardingRoutes');
const otpRoutes = require('./routes/otpRoutes');
const userRoutes = require('./routes/userRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const authRoutes = require('./routes/authRoutes');
const debugRoutes = require('./routes/debugRoutes');

// Initialize Express app
const app = express();
app.set('trust proxy', 1);
// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://edu-chain-zeta.vercel.app/',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply general rate limiter to all routes
app.use(apiLimiter);

// Request logger middleware (before routes)
app.use((req, res, next) => {
  console.log(`📍 ${req.method} ${req.path}`);
  next();
});

// Root route for friendly message
app.get('/', (req, res) => {
  res.send('🎓 EduChain Backend API is running! Use /api/* endpoints.');
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'EduChain Backend API is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/applications', applicationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/user', userRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/debug', debugRoutes);

// 404 handler
app.use((req, res) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  // Handle multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      error: 'File size too large. Maximum size is 10MB.'
    });
  }

  if (err.message && err.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      error: err.message
    });
  }

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Database connection
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/educhain';
    console.log('🔌 Connecting to MongoDB:', mongoUri.replace(/:[^:]+@/, ':***@')); // Hide password in logs
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB connected successfully');
    console.log('📊 Database name:', mongoose.connection.db.databaseName);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Initialize services
const initializeServices = () => {
  try {
    initIPFS();
    initEmailTransporter();
    console.log('✅ Services initialized successfully');
  } catch (error) {
    console.error('❌ Service initialization error:', error);
  }
};

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Initialize services
    initializeServices();
    
    // Start listening
    app.listen(PORT, () => {
      console.log('🚀 ========================================');
      console.log(`🎓 EduChain Backend API`);
      console.log(`📡 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API URL: http://localhost:${PORT}`);
      console.log('🚀 ========================================');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  // Close server & exit process
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed');
    process.exit(0);
  });
});

// Start the server
startServer();

module.exports = app;
