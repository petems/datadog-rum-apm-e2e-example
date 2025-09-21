# Datablog - Datadog RUM & APM E2E Example

A blog application demonstrating end-to-end tracing with Datadog Real User Monitoring (RUM) and
Application Performance Monitoring (APM).

### App Screenshots

![Datablog Screenshot](docs/screenshots/homepage.png)

### Trace E2E Screenshot

![RUM and APM Connected Trace](docs/screenshots/rum-and-apm-trace.png)

## What This Project Does

**Datablog** is a full-stack blog application that demonstrates:

- **Real User Monitoring (RUM)**: Tracks user interactions, page views, and frontend performance
- **Application Performance Monitoring (APM)**: Monitors backend API calls, database queries, and
  custom instrumentation
- **Distributed Tracing**: Connects frontend requests to backend traces for end-to-end visibility
- **Custom Instrumentation**: Examples of manual span creation and custom metrics in RUM and APM
- **Error Tracking**: Captures both frontend and backend errors with context

## ⚠️ Architecture Notes

This example demonstrates a modern full-stack architecture:

- **Separated Frontend & Backend**: React SPA frontend with Express.js API backend
- **React Single Page Application**: Modern frontend built with Vite and React Router
- **RESTful API**: Express.js serves as a dedicated API server with authentication
- **Development Focus**: Optimized for learning RUM-APM integration concepts

**Architecture Benefits**:

- Clear separation of concerns between frontend and backend
- React SPA with proper build process and optimization (Vite)
- CORS configuration for cross-origin requests
- Independent scaling potential for frontend and backend
- Modern development workflow with hot reloading

This architecture closely mirrors real-world applications while maintaining simplicity for learning
RUM-APM integration concepts.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React SPA     │    │   Express.js    │    │   Database      │
│   Frontend      │    │   API Server    │    │   (MongoDB)     │
│   (RUM)         │    │   (APM)         │    │                 │
│                 │    │                 │    │                 │
│ • React Router  │───▶│ • RESTful API   │───▶│ • Page Storage  │
│ • User Context  │    │ • Authentication│    │ • User Data     │
│ • Performance   │    │ • Custom Spans  │    │ • Collections   │
│ • Interactions  │    │ • Rate Limiting │    │                 │
│                 │    │                 │    │                 │
│ Port: 5173      │    │ Port: 3000      │    │ Port: 27017     │
│ (Vite Dev)      │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Datadog       │
                    │   Agent         │
                    │                 │
                    │ • RUM Data      │
                    │ • APM Traces    │
                    │ • Metrics       │
                    │ • Logs          │
                    └─────────────────┘
```

## Getting Started

### Prerequisites

- Docker & Docker Compose
- Node.js 22.18.0+ (for local development)
- Datadog API Key
- Datadog RUM Application credentials

### Quick Start with Setup Script

For the fastest setup experience, use our automated setup script:

```bash
git clone https://github.com/petems/datadog-rum-apm-e2e-example
cd datadog-rum-apm-e2e-example
./setup.sh
```

The setup script will:

- ✅ Check prerequisites (Node.js, npm, Docker, Docker Compose)
- ✅ Create environment files from templates if missing
- ✅ Validate environment configuration
- ✅ Build Docker images and start services
- ✅ Seed the database with sample data
- ✅ Provide final instructions and helpful commands

**Note**: You'll still need to configure your Datadog credentials in `.env` and `client/.env` before
running the script.

### Manual Docker Compose Deployment

If you prefer to set up manually or need more control:

1. **Clone and Setup**

   ```bash
   git clone https://github.com/petems/datadog-rum-apm-e2e-example
   cd datadog-rum-apm-e2e-example
   cp .env.example .env
   ```

2. **Configure Environment**

   Edit `.env` with your Datadog credentials:

   ```bash
   DD_API_KEY=your_api_key_here
   DD_SITE=datadoghq.com  # Or your Datadog site
   ```

3. **Configure RUM (Frontend Monitoring)**

   Set up the RUM configuration in the client folder:

   ```bash
   cd client
   cp .env.example .env
   ```

   Edit `client/.env` with your Datadog RUM credentials:

   ```bash
   VITE_DD_RUM_APP_ID=your_rum_application_id
   VITE_DD_RUM_CLIENT_TOKEN=your_rum_client_token
   VITE_DD_SITE=datadoghq.com  # Or your Datadog site
   ```

   To obtain these credentials:
   - Log into your [Datadog account](https://app.datadoghq.com/)
   - Navigate to **UX Monitoring** → **RUM Applications**
   - Create a new RUM application or select an existing one
   - Copy the **Application ID** and **Client Token**

4. **Build and Start Services**

   ```bash
   # Build the application image
   docker-compose build

   # Start all services (app, MongoDB, Datadog Agent)
   docker-compose up -d

   # If Mongo exits immediately, ensure disk space is available and
   # a persistent volume is attached. This compose file mounts a
   # named volume `mongo-data` to /data/db and waits for Mongo health
   # before starting the app.

   # View logs (optional)
   docker-compose logs -f
   ```

5. **Verify Services**

   ```bash
   # Check all containers are running
   docker-compose ps

   # Should show 3 services: app, mongo, datadog-agent
   ```

6. **Seed Initial Data**

   Once the services are running, seed the database with initial users and sample data:

   ```bash
   # Seed database with sample users and content
   npm run seed:docker
   ```

   This creates sample users you can use to log in, or register new users via the web interface at
   http://localhost:3000

7. **Access Application**
   - Frontend: http://localhost:3000 (serves React SPA)
   - Backend API: http://localhost:3000/api
   - MongoDB: localhost:27017
   - Datadog Agent: localhost:8126 (APM), localhost:8125 (StatsD)

8. **Stop Services**

   ```bash
   docker-compose down
   ```

### Local Development

1. **Install Dependencies**

   ```bash
   # Install backend dependencies
   npm install

   # Install frontend dependencies
   cd client && npm install && cd ..
   ```

2. **Configure Environment**

   ```bash
   # Setup backend environment
   cp .env.example .env
   # Edit .env with your Datadog API key

   # Setup frontend RUM configuration
   cd client
   cp .env.example .env
   # Edit client/.env with your RUM credentials
   cd ..
   ```

3. **Setup MongoDB**

   ```bash
   # Using Docker
   docker run -d -p 27017:27017 --name mongo mongo

   # Or install MongoDB locally
   ```

4. **Start Development Servers**

   ```bash
   # Terminal 1: Start backend API server
   npm start                    # Starts on http://localhost:3000

   # Terminal 2: Start frontend development server
   cd client && npm run dev     # Starts on http://localhost:5173
   ```

   The React development server (port 5173) will proxy API requests to the backend server (port
   3000).

5. **Seed Database**

```bash
npm run seed              # Seed database with sample users and content
```

6. **Run Tests**

```bash
npm test                    # Unit tests
npm run test:coverage      # Coverage report
npm run test:e2e          # End-to-end tests
npm run test:e2e:ui       # E2E tests with UI
```

Tip: Quick E2E iteration without docker-compose The Playwright config probes Mongo at
127.0.0.1:27017 and prints a hint if it’s not reachable.

Start Mongo quickly with either:

```bash
docker run -d -p 27017:27017 --name mongo mongo:7.0
# or
docker compose up -d mongo
```

Override host/port via env when running tests:

```bash
MONGO_HOST=localhost MONGO_PORT=27018 npm run test:e2e
```

## 🔧 Development Workflows

### Code Quality

```bash
npm run lint              # Check code style
npm run lint:fix          # Auto-fix linting issues
npm run format            # Format code with Prettier
npm run format:check      # Check formatting
```

### Testing Strategy

- **Unit Tests**: Jest for backend logic and API endpoints
- **Integration Tests**: API testing with supertest
- **E2E Tests**: Playwright for full user journey testing
- **Visual Regression**: Automated screenshot comparison

### Auth & CSRF

- The auth API lives under `/api/auth` with CSRF protection enabled.
- Obtain a CSRF token first, then include it in the `csrf-token` header for state-changing requests.

Example flow with curl (replace placeholders):

1. Fetch CSRF token

```
curl -i http://localhost:3000/api/auth/csrf
```

2. Register

```
curl -i -X POST http://localhost:3000/api/auth/register \
  -H 'Content-Type: application/json' \
  -H 'csrf-token: <csrfToken>' \
  --data '{"email":"me@example.com","password":"Password1"}'
```

3. Login (stores refresh cookie and returns access token)

```
curl -i -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -H 'csrf-token: <csrfToken>' \
  --data '{"email":"me@example.com","password":"Password1"}'
```

4. Refresh access token (requires refresh_token cookie)

```
curl -i -X POST http://localhost:3000/api/auth/refresh \
  -H 'csrf-token: <csrfToken>' \
  --cookie 'refresh_token=<value>'
```

5. Get current user

```
curl -i http://localhost:3000/api/auth/me \
  -H 'Authorization: Bearer <accessToken>'
```

6. Logout (invalidates refresh via tokenVersion bump)

```
curl -i -X POST http://localhost:3000/api/auth/logout \
  -H 'Authorization: Bearer <accessToken>' \
  -H 'csrf-token: <csrfToken>' \
  --cookie 'refresh_token=<value>'
```

### Monitoring Development

1. **Custom Instrumentation**: See examples in `controllers/manage-pages.js`
2. **RUM Configuration**: Configured in `client/src/rum.js` for React SPA
3. **RUM User Tracking**: User context management in `client/src/utils/rum.js`
4. **Custom Metrics**: StatsD integration for page views
5. **Error Tracking**: Automatic error capture and logging

### Database Operations

```bash
# Connect to MongoDB
docker exec -it mongo mongosh

# View collections
show collections

# Query pages
db.pages.find().pretty()
```

## Features Implemented

### Current Functionality

- **Authentication System** ✅
  - User registration and login with React SPA
  - JWT token management (access/refresh tokens)
  - Role-based access control
  - Session management with RUM user tracking
  - CSRF protection for state-changing requests

- **Modern Frontend Architecture** ✅
  - React Single Page Application with React Router
  - Vite build system with hot module replacement
  - Component-based UI with Bootstrap styling
  - RUM user context management and event tracking

## 📸 Screenshots

### Homepage

![Homepage](docs/screenshots/homepage.png)

_Screenshots are automatically updated via the `npm run screenshot` command_

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style (ESLint + Prettier)
- Write tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE.md) file for details.

## Support

- **Issues**: Report bugs and feature requests via GitHub Issues
- **Documentation**: Check the [Datadog documentation](https://docs.datadoghq.com/)
- **Community**: Join the [Datadog community](https://community.datadoghq.com/)

## Related Resources

- [Datadog RUM Documentation](https://docs.datadoghq.com/real_user_monitoring/)
- [Datadog APM Documentation](https://docs.datadoghq.com/tracing/)
- [Node.js Tracing Guide](https://datadoghq.dev/dd-trace-js/)
- [RUM-APM Integration Guide](https://docs.datadoghq.com/real_user_monitoring/connect_rum_and_traces/)
