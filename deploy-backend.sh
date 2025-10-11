#!/bin/bash

# EcoSystem Backend Deployment Script

echo "🚀 Preparing EcoSystem backend for deployment..."

# Copy backend package.json to root for deployment
cp backend-package.json package.json

echo "✅ Updated package.json for backend deployment"
echo "📦 Ready to deploy to Render with:"
echo "   - Build Command: npm install"
echo "   - Start Command: npm start"
echo "   - Main file: server/index.js"

echo ""
echo "🔧 Required Environment Variables for Render:"
echo "   - CLOUDINARY_CLOUD_NAME"
echo "   - CLOUDINARY_API_KEY" 
echo "   - CLOUDINARY_API_SECRET"
echo "   - JWT_SECRET"
echo "   - PORT (will be set automatically by Render)"

echo ""
echo "🌐 After deployment, update your frontend API URL to point to the Render URL"