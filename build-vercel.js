#!/usr/bin/env node
// Enhanced diagnostic build script for Vercel deployment debugging
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('=== STARTING JOBSCANS BUILD WITH FULL DIAGNOSTICS ===');
console.log(`Build environment: ${process.env.NODE_ENV || 'undefined'}`);
console.log(`Working directory: ${process.cwd()}`);
console.log(`Node version: ${process.version}`);

// Environment diagnostics
console.log('\n=== ENVIRONMENT DIAGNOSTICS ===');
const hasTogetherKey = !!process.env.TOGETHER_API_KEY;
console.log(`TOGETHER_API_KEY: ${hasTogetherKey ? 'Available' : 'Missing'}`);
console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? 'Available' : 'Missing'}`);
console.log(`STRIPE keys: ${process.env.STRIPE_SECRET_KEY ? 'Available' : 'Missing'}`);

// File system diagnostics
console.log('\n=== FILE SYSTEM DIAGNOSTICS ===');
const serverRoutes = path.join(process.cwd(), 'server/routes.ts');
const packageJson = path.join(process.cwd(), 'package.json');
console.log(`server/routes.ts exists: ${fs.existsSync(serverRoutes)}`);
console.log(`package.json exists: ${fs.existsSync(packageJson)}`);

if (fs.existsSync('node_modules')) {
  console.log('node_modules directory exists');
  const esbuildPath = path.join(process.cwd(), 'node_modules/.bin/esbuild');
  const vitePath = path.join(process.cwd(), 'node_modules/.bin/vite');
  console.log(`esbuild binary exists: ${fs.existsSync(esbuildPath)}`);
  console.log(`vite binary exists: ${fs.existsSync(vitePath)}`);
} else {
  console.log('node_modules directory missing!');
}

// Set build-time environment variable
process.env.VITE_SERVICE_MODE = hasTogetherKey ? 'full' : 'minimal';

// Enhanced command execution with detailed error reporting
function tryCommand(commands, description) {
  console.log(`\n=== ${description.toUpperCase()} ===`);
  
  for (let i = 0; i < commands.length; i++) {
    const cmd = commands[i];
    console.log(`Attempt ${i + 1}/${commands.length}: ${cmd}`);
    
    try {
      console.log(`Executing: ${cmd}`);
      const result = execSync(cmd, { 
        stdio: 'pipe', 
        cwd: process.cwd(),
        encoding: 'utf8'
      });
      console.log(`SUCCESS: ${description}`);
      console.log('Output:', result);
      return true;
    } catch (error) {
      console.error(`FAILED: ${cmd}`);
      console.error('Exit code:', error.status);
      console.error('Error output:', error.stderr);
      console.error('Standard output:', error.stdout);
      
      if (i === commands.length - 1) {
        console.error(`All attempts failed for: ${description}`);
      } else {
        console.log('Trying next command...');
      }
    }
  }
  throw new Error(`All ${description} commands failed - see detailed errors above`);
}

try {
  // Build frontend with diagnostics
  tryCommand([
    'npx vite build',
    './node_modules/.bin/vite build',
    'node_modules/.bin/vite build'
  ], 'frontend build');
  
  // Check if frontend build succeeded
  const frontendDist = path.join(process.cwd(), 'dist/public');
  console.log(`\nFrontend build output exists: ${fs.existsSync(frontendDist)}`);
  
  // Build backend with enhanced diagnostics
  tryCommand([
    'npx esbuild server/routes.ts --platform=node --packages=external --bundle --format=cjs --outdir=dist',
    './node_modules/.bin/esbuild server/routes.ts --platform=node --packages=external --bundle --format=cjs --outdir=dist',
    'node_modules/.bin/esbuild server/routes.ts --platform=node --packages=external --bundle --format=cjs --outdir=dist'
  ], 'backend build');
  
  // Verify backend build output
  const backendDist = path.join(process.cwd(), 'dist/routes.js');
  console.log(`\nBackend build output exists: ${fs.existsSync(backendDist)}`);
  
  if (fs.existsSync(backendDist)) {
    const fileSize = fs.statSync(backendDist).size;
    console.log(`Backend build size: ${fileSize} bytes`);
  }
  
  console.log('\n=== BUILD COMPLETED SUCCESSFULLY ===');
  console.log('All build steps completed without errors');
  
} catch (error) {
  console.error('\n=== BUILD FAILED ===');
  console.error('Primary error:', error.message);
  console.error('Stack trace:', error.stack);
  
  // Additional diagnostic info on failure
  console.log('\n=== FAILURE DIAGNOSTICS ===');
  console.log('Current directory contents:');
  try {
    const files = fs.readdirSync(process.cwd());
    files.forEach(file => console.log(`  ${file}`));
  } catch (dirError) {
    console.error('Could not read directory:', dirError.message);
  }
  
  process.exit(1);
}
