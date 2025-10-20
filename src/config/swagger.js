const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');

// Swagger definition
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'NTC Bus Tracking API',
    version: '1.0.0',
    description: 'RESTful API for real-time tracking of inter-provincial bus services in Sri Lanka. Provides endpoints for managing operators, routes, buses, trips, and GPS location tracking.'
  },
  servers: [
    {
      url: 'https://web-api-cw.onrender.com',
      description: 'Production server'
    },
    {
      url: 'http://localhost:3000',
      description: 'Development server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token from /api/auth/login'
      }
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ]
};

// Debug: Print current directory
console.log('Current directory:', __dirname);
console.log('Looking for routes at:', path.join(__dirname, '../routes/'));

// Options for swagger-jsdoc
const options = {
  swaggerDefinition,
  apis: [
    path.join(__dirname, '../routes/authRoutes.js'),
    path.join(__dirname, '../routes/operatorRoutes.js'),
    path.join(__dirname, '../routes/routeRoutes.js'),
    path.join(__dirname, '../routes/busRoutes.js'),
    path.join(__dirname, '../routes/tripRoutes.js'),
    path.join(__dirname, '../routes/locationRoutes.js')
  ]
};

// Generate swagger specification
const swaggerSpec = swaggerJsdoc(options);

// Debug: Print what Swagger found
console.log('Swagger paths found:', Object.keys(swaggerSpec.paths || {}));
console.log('Number of endpoints:', Object.keys(swaggerSpec.paths || {}).length);

module.exports = { swaggerUi, swaggerSpec };