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
    // Import the compiled routes
    const { registerRoutes } = await import('../dist/routes.js');
    await registerRoutes(app);
    routesInitialized = true;
  } catch (error) {
    console.error('Failed to initialize routes:', error);
    // Fallback: basic health check
    app.get('/api/health', (req, res) => {
      res.json({ status: 'error', message: 'Routes failed to initialize', error: error.message });
    });
    routesInitialized = true;
  }
}

// Export for Vercel
module.exports = async (req, res) => {
  await initializeRoutes();
  return app(req, res);
};
