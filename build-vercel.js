#!/usr/bin/env node
// Robust build script for Vercel deployment - handles both direct calls and package.json fallback
const { execSync } = require('child_process');
const path = require('path');

console.log('Starting JobScans build...');

// Function to try multiple command variations
function tryCommand(commands, description) {
  for (const cmd of commands) {
    try {
      console.log(`${description} with: ${cmd}`);
      execSync(cmd, { stdio: 'inherit', cwd: process.cwd() });
      return true;
    } catch (error) {
      console.log(`Failed with ${cmd}, trying next...`);
    }
  }
  throw new Error(`All ${description} commands failed`);
}

try {
  // Build frontend - try multiple approaches
  tryCommand([
    'npx vite build',
    './node_modules/.bin/vite build',
    'node_modules/.bin/vite build'
  ], 'Building frontend');
  
  // Build backend for Vercel serverless
  tryCommand([
    'npx esbuild server/routes.ts --platform=node --packages=external --bundle --format=cjs --outdir=dist',
    './node_modules/.bin/esbuild server/routes.ts --platform=node --packages=external --bundle --format=cjs --outdir=dist',
    'node_modules/.bin/esbuild server/routes.ts --platform=node --packages=external --bundle --format=cjs --outdir=dist'
  ], 'Building backend');
  
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}
