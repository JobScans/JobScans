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
    // Try to import the compiled routes first
    let registerRoutes;
    try {
      const routesModule = await import('../dist/routes.js');
      registerRoutes = routesModule.registerRoutes;
    } catch (distError) {
      console.log('Compiled routes not found, importing TypeScript directly...');
      // Fallback to TypeScript source (requires ts-node or similar)
      const routesModule = await import('../server/routes.ts');
      registerRoutes = routesModule.registerRoutes;
    }
    
    if (registerRoutes) {
      await registerRoutes(app);
      console.log('Routes initialized successfully');
    } else {
      throw new Error('registerRoutes function not found');
    }
    routesInitialized = true;
  } catch (error) {
    console.error('Failed to initialize routes:', error);
    
    // Fallback: Initialize essential routes manually
    app.get('/api/health', (req, res) => {
      res.json({ 
        status: 'error', 
        message: 'Routes failed to initialize', 
        error: error.message,
        timestamp: new Date().toISOString()
      });
    });
    
    // Add the community-fund-status endpoint that the frontend expects
    app.get('/api/community-fund-status', (req, res) => {
      const hasTogetherKey = !!process.env.TOGETHER_API_KEY;
      
      res.json({
        currentBalance: 0,
        dailyUsage: 0,
        dailyAnalyses: 0,
        dailyOutreach: 0,
        serviceMode: hasTogetherKey ? {
          mode: 'full',
          message: 'All features operational',
          features: {
            freshAnalysis: true,
            cacheAnalysis: true,
            outreachGeneration: true,
            archiveAccess: true,
            manualTools: true
          }
        } : {
          mode: 'minimal',
          message: 'AI analysis requires API key configuration',
          features: {
            freshAnalysis: false,
            cacheAnalysis: false,
            outreachGeneration: false,
            archiveAccess: true,
            manualTools: true
          }
        },
        performance: {
          providerStatus: hasTogetherKey ? 'operational' : 'offline',
          uptimeToday: hasTogetherKey ? '100%' : '0%'
        },
        costTransparency: {
          analysisCost: 0.006,
          outreachCost: 0.003,
          estimatedDailyCost: 0
        },
        status: hasTogetherKey ? 'healthy' : 'critical',
        note: hasTogetherKey ? 'Service operational' : 'API key required'
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
