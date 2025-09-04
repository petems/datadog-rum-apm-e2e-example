# Datablog - Separated Services Architecture

This document describes the separated frontend/backend architecture for the Datablog application.

## Architecture Overview

The application has been split into two separate services:

### 🔧 datablog-api (Backend)
- **Port**: 3001
- **Technology**: Express.js + MongoDB + Datadog APM
- **Routes**: `/api/page`, `/api/pages`, `/api/auth`
- **Responsibilities**: 
  - API endpoints for CRUD operations
  - Authentication and authorization
  - Database operations with MongoDB
  - APM tracing with dd-trace

### 🎨 datablog-ui (Frontend)
- **Port**: 3000  
- **Technology**: Static HTML + JavaScript + Datadog RUM
- **Responsibilities**:
  - Serve static frontend assets
  - Client-side rendering and API calls
  - RUM monitoring for user interactions
  - CORS-enabled communication with API

## Quick Start

### Option 1: Docker Compose (Recommended)
```bash
# Start all services
./start-separated.sh

# Or manually:
docker-compose -f docker-compose.separated.yml up --build
```

### Option 2: Local Development
```bash
# Terminal 1 - Start API
cd datablog-api
npm install
npm start    # Runs on port 3001

# Terminal 2 - Start UI  
cd datablog-ui
npm install
npm start    # Runs on port 3000

# Terminal 3 - Start MongoDB
docker run -d -p 27017:27017 mongo:7.0
```

## Service Communication

- **Frontend → Backend**: HTTP requests to `http://localhost:3001/api/*`
- **Authentication**: JWT tokens stored in httpOnly cookies
- **CORS**: Configured to allow `http://localhost:3000` → `http://localhost:3001`
- **RUM-APM Correlation**: Maintained via `allowedTracingOrigins` configuration

## Environment Variables

Update `.env` with your Datadog credentials:

```env
DD_API_KEY=your_api_key
DD_CLIENT_TOKEN=your_client_token  
DD_APPLICATION_ID=your_app_id
DD_SITE=datadoghq.com
```

## Architecture Benefits

1. **Independent Scaling**: Scale frontend and backend independently
2. **Technology Flexibility**: Different tech stacks for each service
3. **Team Separation**: Frontend and backend teams can work independently
4. **Deployment Flexibility**: Deploy services to different environments
5. **Monitoring Separation**: Separate RUM and APM service names

## File Structure

```
├── datablog-api/              # Backend API service
│   ├── routes/               # API routes
│   ├── controllers/          # Business logic
│   ├── mongo/               # Database models
│   ├── middlewares/         # Auth, CORS, etc.
│   ├── app.js              # Express app
│   └── Dockerfile          # API container
├── datablog-ui/              # Frontend service  
│   ├── public/             # Static assets
│   │   ├── index.html     # Main SPA
│   │   └── vendor/        # Third-party libs
│   ├── server.js          # Static file server
│   └── Dockerfile         # UI container
└── docker-compose.separated.yml  # Multi-service setup
```

## Testing

```bash
# Test API health
curl http://localhost:3001/healthz

# Test UI health  
curl http://localhost:3000/healthz

# Test full flow
open http://localhost:3000
```

## Migration Notes

### From Original Monolith:
- EJS templates → Static HTML + JavaScript
- Server-side rendering → Client-side rendering
- Single service → Two services with CORS
- Mixed routes → Separated API vs UI routes

### Key Changes:
1. **Authentication**: Still JWT-based but API-only
2. **Data Loading**: Client-side fetch() calls instead of server rendering
3. **RUM Configuration**: Updated `allowedTracingOrigins` for cross-service tracing
4. **Docker Networking**: Services communicate via Docker network

## Troubleshooting

### Common Issues:

1. **CORS Errors**: Check `FRONTEND_URL` environment variable in datablog-api
2. **Auth Issues**: Ensure cookies are properly configured for cross-origin
3. **RUM Not Working**: Verify `allowedTracingOrigins` includes API service URL
4. **Docker Network**: Services must be on same Docker network to communicate

### Logs:
```bash
# View all service logs
docker-compose -f docker-compose.separated.yml logs -f

# View specific service
docker-compose -f docker-compose.separated.yml logs datablog-api
docker-compose -f docker-compose.separated.yml logs datablog-ui
```