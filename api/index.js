// Vercel serverless function wrapper for JobScans API
const express = require('express');

// Create a single app instance
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Initialize routes inline for serverless
let routesInitialized = false;

async function initializeRoutes() {
  if (routesInitialized) return;
  
  try {
    // Try to import the compiled routes from different possible locations
    let registerRoutes;
    
    try {
      // First try the expected build output
      const routesModule = await import('../dist/routes.js');
      registerRoutes = routesModule.registerRoutes;
    } catch (importError) {
      console.log('Dist import failed, trying direct TypeScript import...');
      // Fallback: try direct TypeScript import (in case esbuild didn't run)
      const routesModule = await import('../server/routes.ts');
      registerRoutes = routesModule.registerRoutes;
    }
    
    if (registerRoutes) {
      await registerRoutes(app);
      routesInitialized = true;
      console.log('Routes initialized successfully');
    } else {
      throw new Error('registerRoutes function not found');
    }
  } catch (error) {
    console.error('Failed to initialize routes:', error.message);
    console.error('Stack:', error.stack);
    
    // Fallback: Initialize basic routes manually
    app.get('/api/health', (req, res) => {
      res.json({ 
        status: 'error', 
        message: 'Routes failed to initialize', 
        error: error.message,
        timestamp: new Date().toISOString()
      });
    });
    
    // Add a basic status endpoint
    app.get('/api/community-fund-status', (req, res) => {
      res.json({
        status: 'critical',
        serviceMode: { mode: 'minimal', message: 'Server initialization failed' },
        note: 'Server startup error',
        error: error.message
      });
    });
    
    routesInitialized = true;
  }
}

// Export for Vercel
module.exports = async (req, res) => {
  await initializeRoutes();
  return app(req, res);
};
