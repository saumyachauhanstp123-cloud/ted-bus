const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// =====================
// MIDDLEWARE
// =====================
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:4200',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// =====================
// ROUTES
// =====================
app.use('/api/auth',         require('./routes/authRoutes'));
app.use('/api/bus',          require('./routes/busRoutes'));
app.use('/api/booking',      require('./routes/bookingRoutes'));
app.use('/api/notification', require('./routes/notificationRoutes'));
app.use('/api/community',    require('./routes/communityRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/routes', require('./routes/routeRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/offers', require('./routes/offerRoutes'));

// =====================
// HEALTH CHECK
// =====================
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🚌 TED BUS Backend is Running!',
    version: '1.0.0',
    endpoints: {
      auth:         '/api/auth',
      bus:          '/api/bus',
      booking:      '/api/booking',
      notification: '/api/notification',
      community:    '/api/community',
       admin:        '/api/admin',
    }
  });
});

// =====================
// 404 HANDLER
// =====================
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// =====================
// GLOBAL ERROR HANDLER
// =====================
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// =====================
// START SERVER
// =====================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Client URL: ${process.env.CLIENT_URL}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV}`);
});