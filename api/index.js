// Vercel serverless function wrapper for JobScans API
import express from 'express';

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
      // Try multiple possible paths for the compiled routes
      let routesModule;
      try {
        // First try the copied routes file in the same directory
        routesModule = await import('./routes.js');
      } catch (e1) {
        try {
          routesModule = await import('../dist/routes.js');
        } catch (e2) {
          try {
            routesModule = await import('/var/task/dist/routes.js');
          } catch (e3) {
            console.log('Route import attempts failed:', { e1: e1.message, e2: e2.message, e3: e3.message });
            throw new Error('All route import paths failed');
          }
        }
      }
      registerRoutes = routesModule.registerRoutes;
      if (!registerRoutes) {
        throw new Error('registerRoutes function not found in imported module');
      }
    } catch (distError) {
      console.log('Compiled routes not found, trying alternate paths...');
      console.log('Error details:', distError.message);
      throw new Error('Compiled routes not available, using fallback endpoints');
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
    
    // Add the usage-status endpoint that the frontend expects
    app.get('/api/usage-status', (req, res) => {
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

    // Also keep the old endpoint for backward compatibility
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

    // Redirect to dedicated analyze-job function
    app.post('/api/analyze-job', (req, res) => {
      res.status(501).json({
        error: 'Use dedicated endpoint',
        message: 'Job analysis handled by /api/analyze-job.js'
      });
    });
    
    routesInitialized = true;
  }
}

// Export for Vercel
export default async (req, res) => {
  await initializeRoutes();
  return app(req, res);
};
