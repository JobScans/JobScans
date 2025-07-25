#!/usr/bin/env node
// Simple build script for Vercel deployment
const { execSync } = require('child_process');
const path = require('path');

console.log('Starting JobScans build...');

try {
  // Build frontend
  console.log('Building frontend with Vite...');
  execSync('npx vite build', { stdio: 'inherit', cwd: process.cwd() });
  
  // Build backend for Vercel serverless  
  console.log('Building backend with esbuild...');
  execSync('npx esbuild server/routes.ts --platform=node --packages=external --bundle --format=cjs --outdir=dist', { stdio: 'inherit', cwd: process.cwd() });
  
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}