# Development Guide

This guide covers the development workflows, best practices, and technical details for the Datablog
application.

## 🏗️ Project Structure

```
datadog-rum-apm-e2e-example/
├── app.js                 # Main application entry point
├── bin/www               # HTTP server setup
├── config/               # Configuration files
│   ├── mongo.js         # MongoDB connection
│   └── rum.js           # RUM configuration
├── controllers/          # Business logic
│   └── manage-pages.js  # Page management operations
├── mongo/               # Database layer
│   ├── index.js         # MongoDB connection setup
│   └── models/          # Mongoose models
│       └── pageModel.js # Page schema and model
├── public/              # Static assets
│   ├── javascripts/     # Client-side JavaScript
│   └── stylesheets/     # CSS styles
├── routes/              # Express routes
│   ├── api.js          # API endpoints
│   ├── api-pages.js    # Page-specific API
│   ├── index.js        # Homepage routes
│   └── pages.js        # Page management routes
├── scripts/             # Utility scripts
│   ├── screenshot.js   # Screenshot automation
│   └── seed-data.js    # Database seeding
├── test/               # Test files
│   ├── e2e/           # End-to-end tests
│   └── setup/         # Test configuration
├── views/              # EJS templates
│   ├── edit-page.ejs  # Edit page form
│   ├── error.ejs      # Error page
│   ├── index.ejs      # Homepage
│   ├── new-page.ejs   # Create page form
│   └── page.ejs       # Individual page view
└── docs/               # Documentation
    ├── screenshots/    # Application screenshots
    └── DEVELOPMENT.md  # This file
```

## 🚀 Development Workflows

### 1. Local Development Setup

```bash
# Clone and setup
git clone <repository-url>
cd datadog-rum-apm-e2e-example
npm install

# Setup environment
cp .env.example .env
# Edit .env with your Datadog credentials

# Start MongoDB (if not using Docker)
docker run -d -p 27017:27017 --name mongo mongo

# Seed sample data
npm run seed

# Start development server
npm start
```

### 2. Testing Workflow

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Watch mode for unit tests
npm run test:watch
```

### 3. Code Quality Workflow

```bash
# Check code style
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check
```

### 4. Screenshot Workflow

```bash
# Ensure application is running
npm start

# Take screenshots and update README
npm run screenshot
```

## 🔧 Technical Implementation

### Monitoring Integration

#### RUM (Real User Monitoring)

The application uses Datadog RUM to track user interactions:

```javascript
// RUM Configuration (config/rum.js)
window.DD_RUM &&
  window.DD_RUM.init({
    clientToken: '<%= rum.clientToken %>',
    applicationId: '<%= rum.applicationId %>',
    env: '<%= rum.env %>',
    service: '<%= rum.service %>',
    version: '<%= rum.version %>',
    allowedTracingOrigins: [/http:\/\/localhost:3000/],
    trackInteractions: true,
  });
```

#### APM (Application Performance Monitoring)

APM is configured in the main application file:

```javascript
// app.js
require('dd-trace').init({
  enabled: true,
  analytics: true,
  logInjection: true,
});
```

#### Custom Instrumentation

Examples of custom spans in `controllers/manage-pages.js`:

```javascript
// Manual span creation
const span = tracer.startSpan('custom.operation');
span.setTag('custom.tag', 'value');
// ... operation code ...
span.finish();

// Wrapping functions
const wrappedFunction = tracer.wrap('function.name', originalFunction);
```

### Database Layer

#### MongoDB Connection

```javascript
// mongo/index.js
mongoose.connect('mongodb://localhost:27017/datablog', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
```

#### Page Model

```javascript
// mongo/models/pageModel.js
const pageSchema = new Schema({
  id: Number,
  title: String,
  body: String,
  hasAttachment: Boolean,
  createdDate: Date,
  updatedDate: Date,
});
```

### API Design

#### RESTful Endpoints

- `GET /` - Homepage with page list
- `GET /page` - Create new page form
- `POST /api/page` - Create new page
- `GET /page/:id` - View specific page
- `GET /page/:id/edit` - Edit page form
- `PUT /api/page/:id` - Update page
- `DELETE /api/page/:id` - Delete page
- `GET /api/pages` - List all pages

#### Error Handling

```javascript
// Global error handler
app.use(function (err, req, res, _next) {
  const statusCode = err.status || 500;
  res.status(statusCode);
  res.render('error', {
    statusCode,
    message: err.message,
    rum,
  });
});
```

## 🧪 Testing Strategy

### Unit Tests

- **Framework**: Jest
- **Coverage**: Istanbul/nyc
- **Location**: `*.test.js` files alongside source code

### Integration Tests

- **Framework**: Jest + Supertest
- **Scope**: API endpoints and database operations
- **Examples**: `routes/api.test.js`, `mongo/models/pageModel.test.js`

### End-to-End Tests

- **Framework**: Playwright
- **Scope**: Full user journeys
- **Location**: `test/e2e/`

### Visual Regression Tests

- **Framework**: Playwright
- **Scope**: UI consistency
- **Configuration**: `playwright.config.js`

## 📊 Monitoring Best Practices

### 1. Custom Metrics

Use StatsD for custom business metrics:

```javascript
const StatsD = require('hot-shots');
const dogstatsd = new StatsD();

// Track page views
dogstatsd.increment('page.views', [`page:${page_id}`]);
```

### 2. Error Tracking

```javascript
// Frontend error tracking
window.DD_LOGS &&
  DD_LOGS.init({
    clientToken: '<%= rum.clientToken %>',
    forwardErrorsToLogs: true,
  });

// Backend error logging
logger.error('Error message', { context: 'additional info' });
```

### 3. Performance Monitoring

```javascript
// Custom performance spans
const span = tracer.startSpan('database.query');
try {
  const result = await database.query();
  span.setTag('db.rows', result.length);
} catch (error) {
  span.setTag('error', true);
  span.setTag('error.message', error.message);
} finally {
  span.finish();
}
```

## 🔒 Security Considerations

### Input Validation

```javascript
// Validate page_id to prevent SSRF
if (!/^\d+$/.test(page_id)) {
  logger.warn({ page_id }, 'Invalid page_id provided, denied');
  res.status(400).render('error', {
    statusCode: 400,
    message: 'Invalid page ID',
    rum,
  });
  return;
}
```

### Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

const indexRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
```

## 🚀 Deployment

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f app

# Scale services
docker-compose up -d --scale app=3
```

### Environment Variables

Required environment variables:

```bash
# Datadog Configuration
DD_API_KEY=your_api_key
DD_ENV=development
DD_SERVICE=datablog
DD_VERSION=2.0.0

# RUM Configuration
DD_RUM_APPLICATION_ID=your_rum_app_id
DD_RUM_CLIENT_TOKEN=your_rum_client_token

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/datablog
```

## 🔍 Debugging

### Logging

```javascript
// Structured logging with Bunyan
const logger = require('./logger');

logger.info('User action', {
  userId: user.id,
  action: 'page_view',
  pageId: page.id,
});
```

### Development Tools

- **Node.js Inspector**: `node --inspect ./bin/www`
- **MongoDB Compass**: GUI for database management
- **Datadog Dashboard**: Real-time monitoring metrics

## 📈 Performance Optimization

### Database Optimization

- Index frequently queried fields
- Use projection to limit returned fields
- Implement pagination for large datasets

### Caching Strategy

- Redis for session storage
- CDN for static assets
- Browser caching headers

### Code Optimization

- Async/await for I/O operations
- Connection pooling for database
- Compression middleware for responses

## 🤝 Contributing Guidelines

### Code Style

- Follow ESLint configuration
- Use Prettier for formatting
- Write meaningful commit messages

### Testing Requirements

- Unit tests for new features
- Integration tests for API changes
- E2E tests for UI changes

### Documentation

- Update README for user-facing changes
- Add JSDoc comments for new functions
- Update this guide for workflow changes

## 🔗 Useful Resources

- [Datadog RUM Documentation](https://docs.datadoghq.com/real_user_monitoring/)
- [Datadog APM Documentation](https://docs.datadoghq.com/tracing/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [Express.js Security Best Practices](https://expressjs.com/en/advanced/best-practices-security.html)
