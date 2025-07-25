// Simple test endpoint to verify basic Vercel functionality
export default (req, res) => {
  console.log('Test endpoint called');
  console.log('Environment check:', {
    nodeVersion: process.version,
    platform: process.platform,
    cwd: process.cwd(),
    env: {
      DATABASE_URL: !!process.env.DATABASE_URL,
      TOGETHER_API_KEY: !!process.env.TOGETHER_API_KEY,
      STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY
    }
  });
  
  res.json({ 
    status: 'success',
    message: 'Basic Vercel function working',
    timestamp: new Date().toISOString(),
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      hasDatabase: !!process.env.DATABASE_URL,
      hasTogetherKey: !!process.env.TOGETHER_API_KEY
    }
  });
};
