#!/bin/bash

echo "🚀 Starting separated Datablog services..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Copying from .env.example..."
    cp .env.example .env
    echo "✅ Please update .env with your Datadog credentials before continuing."
    exit 1
fi

echo "🐳 Starting services with Docker Compose..."
docker-compose -f docker-compose.separated.yml up --build

echo "✅ Services started!"
echo ""
echo "🌐 Application URLs:"
echo "   Frontend (datablog-ui): http://localhost:3000"
echo "   Backend API (datablog-api): http://localhost:3001"
echo "   MongoDB: localhost:27017"
echo "   Datadog Agent APM: localhost:8126"
echo ""
echo "🔧 To stop services: docker-compose -f docker-compose.separated.yml down"