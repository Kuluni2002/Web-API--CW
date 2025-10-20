// Import required packages
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const { swaggerUi, swaggerSpec } = require('./src/config/swagger');

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

// Add this logging middleware after app.use(express.json());
app.use((req, res, next) => {
    console.log(`${req.method} ${req.originalUrl} - ${new Date().toISOString()}`);
    console.log(`Headers:`, req.headers);
    console.log(`Body:`, req.body);
    next();
});

// Swagger Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'NTC Bus API Documentation'
}));

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const operatorRoutes = require('./src/routes/operatorRoutes');
const routeRoutes = require('./src/routes/routeRoutes');
const busRoutes = require('./src/routes/busRoutes');
const tripRoutes = require('./src/routes/tripRoutes');
const locationRoutes = require('./src/routes/locationRoutes');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/operators', operatorRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/buses', busRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/locations', locationRoutes);

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
// Connect to MongoDB database
mongoose.connect(process.env.MONGODB_URI)
.then(async () => {
    console.log('✓ Connected to MongoDB!');
    
    try {
      const db = mongoose.connection.db;
      
      // === OPERATOR INDEX MANAGEMENT ===
      const operatorCollection = db.collection('operators');
      const operatorIndexes = await operatorCollection.indexes();
      console.log('Current operator indexes:', operatorIndexes.map(idx => idx.name));
      
      // Drop problematic operator indexes
      try {
        await operatorCollection.dropIndex('name_1');
        console.log('✓ Dropped operator name_1 index');
      } catch (e) {
        console.log('operator name_1 index not found or already dropped');
      }
      
      try {
        await operatorCollection.dropIndex('email_1');
        console.log('✓ Dropped operator email_1 index');
      } catch (e) {
        console.log('operator email_1 index not found or already dropped');
      }
      
      // Ensure permitNumber index exists and is unique
      try {
        await operatorCollection.createIndex({ permitNumber: 1 }, { unique: true });
        console.log('✓ Ensured operator permitNumber unique index exists');
      } catch (e) {
        console.log('operator permitNumber index already exists');
      }
      
      // === ROUTE INDEX MANAGEMENT ===
      const routeCollection = db.collection('routes');
      const routeIndexes = await routeCollection.indexes();
      console.log('Current route indexes:', routeIndexes.map(idx => idx.name));
      
      // Drop problematic route indexes
      try {
        await routeCollection.dropIndex('operatorId_1');
        console.log('✓ Dropped route operatorId_1 index');
      } catch (e) {
        console.log('route operatorId_1 index not found or already dropped');
      }
      
      // Ensure routeNumber index exists and is unique
      try {
        await routeCollection.createIndex({ routeNumber: 1 }, { unique: true });
        console.log('✓ Ensured route routeNumber unique index exists');
      } catch (e) {
        console.log('route routeNumber index already exists');
      }
      
    } catch (error) {
      console.error('Error managing indexes:', error.message);
    }
  })
  .catch(err => console.error('✗ MongoDB connection error:', err));

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✓ Server is running on http://localhost:${PORT}`);
});