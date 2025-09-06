# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this
repository.

## Project Overview

This is "Datablog" - a Node.js blog application demonstrating Datadog RUM (Real User Monitoring) and
APM (Application Performance Monitoring) integration. It's a simple CRUD application for managing
blog pages with MongoDB storage.

## Architecture

- **Backend**: Express.js server serving API endpoints
- **Frontend**: React SPA with React Router, built with Vite
- **Database**: MongoDB with Mongoose ODM
- **Monitoring**: Datadog dd-trace for APM, browser RUM SDK
- **Deployment**: Docker Compose with Datadog Agent

## Key Components

### Application Structure

**Backend (Express.js API Server)**

- `app.js` - Main Express application setup with Datadog tracer initialization
- `routes/` - Express API routes (index, pages, api)
- `controllers/manage-pages.js` - Business logic with manual tracing examples
- `mongo/` - MongoDB connection and models

**Frontend (React SPA)**

- `client/src/App.jsx` - Main React application with routing
- `client/src/main.jsx` - React application entry point with RUM initialization
- `client/src/components/` - React components (Navigation, Home, PageList, PageDetail, EditPage,
  NewPage, LoginModal)
- `client/src/rum.js` - RUM configuration for browser integration
- `client/package.json` - Frontend dependencies (React 19, React Router, Vite)

### Datadog Integration

The app demonstrates RUM-APM connection via:

- `allowedTracingOrigins` configuration in RUM init
- Custom spans using `tracer.trace()` and `tracer.wrap()`
- Trace correlation through `x-datadog-trace-id` headers
- Separate service names: `datablog` (backend) vs `datablog-ui` (RUM)

## Development Commands

### Local Development

```bash
npm start                    # Start the backend API server (port 3000)
cd client && npm run dev     # Start the frontend development server (Vite)
```

### Testing

```bash
npm test                     # Run Jest unit tests
npm run test:watch          # Run tests in watch mode
npm run test:coverage       # Run tests with coverage report
npm run test:e2e            # Run Playwright end-to-end tests
npm run test:e2e:ui         # Run Playwright tests with UI mode
```

### Code Quality

```bash
npm run lint                # Run ESLint
npm run lint:fix           # Run ESLint with auto-fix
npm run format             # Format code with Prettier
npm run format:check       # Check code formatting
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

- Frontend (React SPA): http://localhost:5173 (Vite dev server)
- Backend API: http://localhost:3000
- MongoDB: localhost:27017
- Datadog Agent: localhost:8126 (APM), localhost:8125 (DogStatsD)

## Testing Framework

### Unit Testing

- **Framework**: Jest
- **Coverage**: Integrated coverage reporting
- **Location**: Tests located alongside source files or in `__tests__` directories
- **Test Environment**: Uses test MongoDB instance

### End-to-End Testing

- **Framework**: Playwright
- **Browsers**: Chromium, Firefox, Safari
- **Test Environment**: Spins up full application stack with MongoDB
- **Reports**: HTML reports with screenshots/videos on failure

### CI/CD Pipeline

The project uses GitHub Actions with multiple jobs:

- **Lint**: ESLint and Prettier formatting checks
- **Test**: Jest unit tests across Node.js 22.18.0, 24
- **Docker**: Build verification and security scanning (Trivy, Hadolint)
- **E2E**: Playwright tests against full application stack

## Important Notes

### Custom Instrumentation

The `controllers/manage-pages.js` file contains examples of both async/await and wrapper-based
custom tracing patterns for APM.

### RUM-APM Connection

The React SPA makes API requests to `/api/page` endpoints which are traced end-to-end. The RUM SDK
adds trace headers that the backend APM picks up for distributed tracing. The frontend communicates
with the Express.js API server via HTTP requests.

### Database Operations

All page CRUD operations go through the `manage-pages.js` controller which includes custom tracing
spans for performance monitoring.

### Development Workflow

After making code changes, always run:

```bash
npm run lint:fix           # Fix linting issues
npm run format             # Format code
npm test                   # Run unit tests
```

This ensures code quality and prevents CI failures.
