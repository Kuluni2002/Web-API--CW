// Import required packages
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Create Express app
const app = express();

// Middleware (software that processes requests)
app.use(cors()); // Allow requests from anywhere
app.use(express.json()); // Understand JSON data

// Test route - this is your first API endpoint!
app.get('/', (req, res) => {
  res.json({ 
    message: 'NTC Bus Tracking API is running!',
    status: 'success'
  });
});

app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API test successful!',
    timestamp: new Date()
  });
});

// Connect to MongoDB database
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✓ Connected to MongoDB!'))
  .catch(err => console.error('✗ MongoDB connection error:', err));

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✓ Server is running on http://localhost:${PORT}`);
});