#!/bin/bash

# Datablog Setup Script
# Automates the setup steps from the README for Docker Compose deployment

set -e  # Exit on any error

echo "🚀 Datablog Setup Script"
echo "========================="
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
print_status "Checking prerequisites..."

# Check Node.js
if command_exists node; then
    NODE_VERSION=$(node --version)
    print_success "Node.js found: $NODE_VERSION"
else
    print_error "Node.js is not installed. Please install Node.js 22.18.0+ and try again."
    exit 1
fi

# Check npm
if command_exists npm; then
    NPM_VERSION=$(npm --version)
    print_success "npm found: v$NPM_VERSION"
else
    print_error "npm is not installed. Please install npm and try again."
    exit 1
fi

# Check Docker
if command_exists docker; then
    DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | cut -d',' -f1)
    print_success "Docker found: $DOCKER_VERSION"
else
    print_error "Docker is not installed. Please install Docker and try again."
    print_error "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check Docker Compose
if command_exists docker-compose || docker compose version >/dev/null 2>&1; then
    if command_exists docker-compose; then
        COMPOSE_VERSION=$(docker-compose --version | cut -d' ' -f3 | cut -d',' -f1)
        COMPOSE_CMD="docker-compose"
    else
        COMPOSE_VERSION=$(docker compose version --short 2>/dev/null || echo "unknown")
        COMPOSE_CMD="docker compose"
    fi
    print_success "Docker Compose found: $COMPOSE_VERSION"
else
    print_error "Docker Compose is not installed. Please install Docker Compose and try again."
    print_error "Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

echo

# Check environment files
print_status "Checking environment files..."

# Check root .env file
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        print_warning "Root .env file not found. Creating from .env.example..."
        cp .env.example .env
        print_warning "Please edit .env with your Datadog API key before continuing."
        print_warning "Required: DD_API_KEY"
    else
        print_error ".env.example file not found. Cannot create .env file."
        exit 1
    fi
else
    print_success "Root .env file found"
fi

# Check if root .env has required variables
if [ -f ".env" ]; then
    if grep -q "DD_API_KEY=your_api_key_here" .env || ! grep -q "DD_API_KEY=" .env; then
        print_warning "DD_API_KEY appears to be unset in .env file"
        print_warning "Please edit .env with your actual Datadog API key"
    else
        print_success "DD_API_KEY appears to be configured in .env"
    fi
fi

# Check client .env file
if [ ! -f "client/.env" ]; then
    if [ -f "client/.env.example" ]; then
        print_warning "Client .env file not found. Creating from client/.env.example..."
        cp client/.env.example client/.env
        print_warning "Please edit client/.env with your Datadog RUM credentials before continuing."
        print_warning "Required: VITE_DD_RUM_APP_ID, VITE_DD_RUM_CLIENT_TOKEN"
    else
        print_error "client/.env.example file not found. Cannot create client/.env file."
        exit 1
    fi
else
    print_success "Client .env file found"
fi

# Check if client .env has required variables
if [ -f "client/.env" ]; then
    if grep -q "VITE_DD_RUM_APP_ID=your_rum_application_id" client/.env || ! grep -q "VITE_DD_RUM_APP_ID=" client/.env; then
        print_warning "VITE_DD_RUM_APP_ID appears to be unset in client/.env file"
    else
        print_success "VITE_DD_RUM_APP_ID appears to be configured in client/.env"
    fi
    
    if grep -q "VITE_DD_RUM_CLIENT_TOKEN=your_rum_client_token" client/.env || ! grep -q "VITE_DD_RUM_CLIENT_TOKEN=" client/.env; then
        print_warning "VITE_DD_RUM_CLIENT_TOKEN appears to be unset in client/.env file"
    else
        print_success "VITE_DD_RUM_CLIENT_TOKEN appears to be configured in client/.env"
    fi
fi

echo

# Ask user to confirm they want to proceed
print_status "Prerequisites check complete!"
echo
read -p "Do you want to proceed with building and starting the services? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_status "Setup cancelled. Please configure your environment files and run this script again."
    exit 0
fi

echo

# Build and start services
print_status "Building Docker images..."
if $COMPOSE_CMD build; then
    print_success "Docker build completed successfully"
else
    print_error "Docker build failed"
    exit 1
fi

echo

print_status "Starting services with Docker Compose..."
if $COMPOSE_CMD up -d; then
    print_success "Services started successfully"
else
    print_error "Failed to start services"
    exit 1
fi

echo

# Wait a moment for services to fully start
print_status "Waiting for services to initialize..."
sleep 5

# Check if services are running
print_status "Checking service status..."
if $COMPOSE_CMD ps | grep -q "Up"; then
    print_success "Services are running"
    $COMPOSE_CMD ps
else
    print_warning "Some services may not be running properly"
    $COMPOSE_CMD ps
fi

echo

# Seed the database
print_status "Seeding database with initial data..."
if npm run seed:docker; then
    print_success "Database seeded successfully"
else
    print_warning "Database seeding failed. You can try running 'npm run seed:docker' manually later."
fi

echo

# Final success message
print_success "🎉 Setup complete!"
echo
echo "Your Datablog application is now ready!"
echo
echo "🌐 Open your browser and visit:"
echo "   ${GREEN}http://localhost:3000${NC}"
echo
echo "📋 Useful commands:"
echo "• View logs: ${BLUE}$COMPOSE_CMD logs -f${NC}"
echo "• Stop services: ${BLUE}$COMPOSE_CMD down${NC}"
echo "• Re-seed database: ${BLUE}npm run seed:docker${NC}"
echo
print_status "Happy coding! 🚀"