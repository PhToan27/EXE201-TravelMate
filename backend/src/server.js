const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to Database & Seed Sample Data
connectDB().then(() => {
  const seedAdminData = require('./services/seedData');
  seedAdminData();
});

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Standard log middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/trips', require('./routes/trip.routes'));
app.use('/api/map', require('./routes/map.routes'));
app.use('/api/navigation', require('./routes/navigation.routes'));
app.use('/api/places', require('./routes/place.routes'));
app.use('/api/posts', require('./routes/post.routes'));
app.use('/api/admin', require('./routes/admin.routes'));



// Basic testing route
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'API is running successfully' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
