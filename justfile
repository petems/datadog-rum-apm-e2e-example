# Justfile for Datablog development tasks

# Default task - show available commands
default:
    @just --list

# Start the development server
start:
    npm start

# Run all tests
test:
    npm test

# Run tests with coverage
test-coverage:
    npm run test:coverage

# Run end-to-end tests
test-e2e:
    npm run test:e2e

# Run E2E tests with UI
test-e2e-ui:
    npm run test:e2e:ui

# Lint code
lint:
    npm run lint

# Lint strictly (CI parity)
lint-ci:
    npm run lint:ci

# Fix linting issues
lint-fix:
    npm run lint:fix

# Format code
format:
    npm run format

# Check code formatting
format-check:
    npm run format:check

# Seed database with sample data
seed:
    npm run seed

# Create or update an admin user
create-admin email password="":
    #!/usr/bin/env bash
    set -euo pipefail
    if [[ -n "{{password}}" ]]; then
      node scripts/create-admin.js '{{email}}' '{{password}}'
    else
      node scripts/create-admin.js '{{email}}'
    fi

# Create admin user with default credentials (for development)
create-admin-dev:
    just create-admin 'admin@example.com' 'AdminPassword123'

# Take screenshots and update README
screenshots:
    #!/usr/bin/env bash
    echo "📸 Taking screenshots and updating README..."
    npm run screenshot

# Take screenshots with custom viewport
screenshot-custom viewport="1200x800":
    #!/usr/bin/env bash
    echo "📸 Taking screenshots with viewport: {{viewport}}..."
    node scripts/screenshot.js --viewport={{viewport}}

# Full development setup
setup:
    #!/usr/bin/env bash
    echo "🚀 Setting up development environment..."
    npm install
    cp .env.example .env 2>/dev/null || echo "⚠️  .env.example not found, please create .env manually"
    echo "✅ Setup complete! Edit .env with your Datadog credentials"

# Start MongoDB (if not using Docker Compose)
mongo-start:
    docker run -d -p 27017:27017 --name mongo mongo

# Stop MongoDB
mongo-stop:
    docker stop mongo
    docker rm mongo

# Start all services with Docker Compose
up:
    docker-compose up -d

# Stop all services
down:
    docker-compose down

# View logs
logs:
    docker-compose logs -f

# Clean up Docker resources
clean:
    docker-compose down -v
    docker system prune -f

# Development workflow: lint, test, format
dev-check:
    #!/usr/bin/env bash
    echo "🔍 Running development checks..."
    just lint-ci
    just format-check
    just test

# Security checks bundle
security:
    #!/usr/bin/env bash
    echo "🛡️  Running security checks..."
    npm run audit
    echo "✅ Dependency audit complete"

# Complete workflow: setup, seed, screenshot
workflow:
    #!/usr/bin/env bash
    echo "🔄 Running complete workflow..."
    just setup
    just seed
    just start &
    sleep 5
    just screenshot
    pkill -f "node ./bin/www" || true

# Show application status
status:
    #!/usr/bin/env bash
    echo "📊 Application Status:"
    echo "====================="
    echo "Node.js version: $(node --version)"
    echo "NPM version: $(npm --version)"
    echo "MongoDB: $(docker ps --filter name=mongo --format 'table {{{{.Status}}}}' 2>/dev/null || echo 'Not running')"
    echo "Application: $(curl -s -o /dev/null -w "%%{http_code}" http://localhost:3000 2>/dev/null || echo 'Not responding')"
    echo "Screenshots: $(ls -1 docs/screenshots/*.png 2>/dev/null | wc -l | tr -d ' ') files"

# Help task
help:
    @echo "Available tasks:"
    @echo "  start              - Start the development server"
    @echo "  test               - Run all tests"
    @echo "  test-coverage      - Run tests with coverage"
    @echo "  test-e2e           - Run end-to-end tests"
    @echo "  lint               - Lint code"
    @echo "  lint-fix           - Fix linting issues"
    @echo "  format             - Format code"
    @echo "  seed               - Seed database with sample data"
    @echo "  create-admin       - Create/update admin user (args: email password)"
    @echo "  create-admin-dev   - Create/update admin user with dev credentials"
    @echo "  screenshot         - Take screenshots and update README"
    @echo "  setup              - Full development setup"
    @echo "  up                 - Start all services with Docker Compose"
    @echo "  down               - Stop all services"
    @echo "  status             - Show application status"
    @echo "  help               - Show this help message"
    @echo "  auth-login         - Login via API (args: email password base_url)"
    @echo "  test-auth          - Run auth route unit tests (mocked DB)"
    @echo "  test-auth-mongo    - Run auth route tests against local Mongo"
    @echo "  mongo-users        - List users in compose Mongo"
    @echo "  create-admin-compose - Upsert admin directly in compose Mongo (bcrypt)"
    @echo "  auth-login         - Login via API (args: email password base_url)"
    @echo "  create-user        - Create/update non-admin user (args: email password)"

# Login via API using CSRF + cookie jar
# Usage:
#   just auth-login 'admin@example.com' 'AdminPassword123'
#   just auth-login 'user@example.com' 'Password1' 'http://localhost:3000'
auth-login email='admin@example.com' password='AdminPassword123' base_url='http://localhost:3000':
    node scripts/auth-login.js '{{email}}' '{{password}}' '{{base_url}}'

# Run auth route tests (mocked DB)
test-auth:
    npm test -- -i routes/auth.test.js --coverage=false

# Run auth route tests against local MongoDB at 127.0.0.1:27017
# Ensure Mongo is running locally (docker or service)
test-auth-mongo:
    npm test -- -i routes/auth.mongo.test.js --coverage=false

# List users via compose Mongo container
mongo-users:
    docker exec mongo mongosh --quiet --eval 'db.getSiblingDB("datablog").users.find({}, {email:1, role:1}).toArray()'

# Upsert admin directly inside compose Mongo using mongosh (bcrypt hashed on host)
create-admin-compose email='admin@example.com' password='AdminPassword123':
    #!/usr/bin/env bash
    set -euo pipefail
    HASH="$(node -e 'const bcrypt=require("bcryptjs");(async()=>{const s=await bcrypt.genSalt(12);const h=await bcrypt.hash(process.argv[1], s);console.log(h);})().catch(e=>{console.error(e);process.exit(1);})' '{{password}}')"
    echo "🔒 Computed bcrypt hash"
    docker exec mongo mongosh --quiet --eval "db.getSiblingDB('datablog').users.updateOne({email:'{{email}}'},{\$set:{email:'{{email}}', role:'admin', passwordHash:'${HASH}', tokenVersion:0}},{upsert:true}); printjson(db.getSiblingDB('datablog').users.find({email:'{{email}}'},{email:1,role:1}).toArray())"

# Create or update a non-admin user
create-user email password="":
    #!/usr/bin/env bash
    set -euo pipefail
    if [[ -n "{{password}}" ]]; then
      node scripts/create-user.js '{{email}}' '{{password}}'
    else
      node scripts/create-user.js '{{email}}'
    fi
