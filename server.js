// Import required packages
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Import models to register them with mongoose
require('./src/models/user');
require('./src/models/operator');
require('./src/models/route');
require('./src/models/bus');
require('./src/models/trip');
require('./src/models/location');

// Create Express app
const app = express();

// Middleware (software that processes requests)
app.use(cors()); // Allow requests from anywhere
app.use(express.json()); // Understand JSON data

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const operatorRoutes = require('./src/routes/operatorRoutes');
const routeRoutes = require('./src/routes/routeRoutes');
const busRoutes = require('./src/routes/busRoutes');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/operators', operatorRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/buses', busRoutes);

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
.then(async () => {
    console.log('✓ Connected to MongoDB!');
    
    // Drop old unique indexes that are causing conflicts
    try {
      const db = mongoose.connection.db;
      const operatorCollection = db.collection('operators');
      
      // Check current indexes
      const indexes = await operatorCollection.indexes();
      console.log('Current indexes:', indexes.map(idx => idx.name));
      
      // Drop problematic indexes
      try {
        await operatorCollection.dropIndex('name_1');
        console.log('✓ Dropped name_1 index');
      } catch (e) {
        console.log('name_1 index not found or already dropped');
      }
      
      try {
        await operatorCollection.dropIndex('email_1');
        console.log('✓ Dropped email_1 index');
      } catch (e) {
        console.log('email_1 index not found or already dropped');
      }
      
      // Ensure permitNumber index exists and is unique
      try {
        await operatorCollection.createIndex({ permitNumber: 1 }, { unique: true });
        console.log('✓ Ensured permitNumber unique index exists');
      } catch (e) {
        console.log('permitNumber index already exists');
      }
      
    } catch (error) {
      console.error('Error managing indexes:', error.message);
    }
  })
  .catch(err => console.error('✗ MongoDB connection error:', err));
 // .then(() => console.log('✓ Connected to MongoDB!'))
  //.catch(err => console.error('✗ MongoDB connection error:', err));

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✓ Server is running on http://localhost:${PORT}`);
});