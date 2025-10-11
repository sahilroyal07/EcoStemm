#!/bin/bash

echo "🚀 Starting Secure File Share Application..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the backend server in the background
echo "🔧 Starting backend server..."
npm run start:server &
BACKEND_PID=$!

# Wait a moment for the backend to start
sleep 3

# Start the React frontend
echo "⚛️  Starting React frontend..."
npm start

# Clean up background process when script exits
trap "kill $BACKEND_PID" EXIT