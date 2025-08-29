# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is "Datablog" - a Node.js blog application demonstrating Datadog RUM (Real User Monitoring) and APM (Application Performance Monitoring) integration. It's a simple CRUD application for managing blog pages with MongoDB storage.

## Architecture

- **Backend**: Express.js server with EJS templating
- **Database**: MongoDB with Mongoose ODM
- **Frontend**: jQuery for AJAX interactions, no framework
- **Monitoring**: Datadog dd-trace for APM, browser RUM SDK
- **Deployment**: Docker Compose with Datadog Agent

## Key Components

### Application Structure
- `app.js` - Main Express application setup with Datadog tracer initialization
- `routes/` - Express routes (index, pages, api)
- `controllers/manage-pages.js` - Business logic with manual tracing examples
- `views/` - EJS templates for all pages
- `mongo/` - MongoDB connection and models
- `config/rum.js` - RUM configuration for browser integration

### Datadog Integration
The app demonstrates RUM-APM connection via:
- `allowedTracingOrigins` configuration in RUM init
- Custom spans using `tracer.trace()` and `tracer.wrap()` 
- Trace correlation through `x-datadog-trace-id` headers
- Separate service names: `datablog` (backend) vs `datablog-ui` (RUM)

## Development Commands

### Local Development
```bash
npm start                    # Start the application (port 3000)
```

### Docker Development
```bash
cp .env.example .env        # Setup environment variables
docker-compose build        # Build application image
docker-compose up -d        # Start all services (app, mongo, datadog-agent)
docker-compose down         # Stop all services
```

## Configuration

### Required Environment Variables
- `DD_API_KEY` - Datadog API key
- `DD_CLIENT_TOKEN` - RUM client token  
- `DD_APPLICATION_ID` - RUM application ID
- `DD_SITE` - Datadog site (default: datadoghq.com)

### Application URLs
- Main app: http://localhost:3000
- MongoDB: localhost:27017
- Datadog Agent: localhost:8126 (APM), localhost:8125 (DogStatsD)

## Important Notes

### Custom Instrumentation
The `controllers/manage-pages.js` file contains examples of both async/await and wrapper-based custom tracing patterns for APM.

### RUM-APM Connection
Browser requests to `/api/page` endpoints are traced end-to-end. The RUM SDK adds trace headers that the backend APM picks up for distributed tracing.

### Database Operations
All page CRUD operations go through the `manage-pages.js` controller which includes custom tracing spans for performance monitoring.