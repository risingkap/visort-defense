#!/bin/bash
# Simple startup script for Railway
echo "Starting ViSort Defense Backend..."
echo "Current directory: $(pwd)"
echo "Listing files:"
ls -la
echo "Looking for server.js..."
find . -name "server.js" -type f
echo "Changing to backend directory..."
cd visort-last/backend
echo "Current directory: $(pwd)"
echo "Listing backend files:"
ls -la
echo "Starting server..."
node server.js
