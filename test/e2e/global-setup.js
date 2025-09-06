const { execSync } = require('child_process');
const net = require('net');

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkPort(host, port, timeoutMs = 2000) {
  return new Promise(resolve => {
    const socket = new net.Socket();
    let done = false;
    const onDone = ok => {
      if (done) {
        return;
      }
      done = true;
      socket.destroy();
      resolve(ok);
    };
    socket.setTimeout(timeoutMs);
    socket.once('error', () => onDone(false));
    socket.once('timeout', () => onDone(false));
    socket.connect(port, host, () => onDone(true));
  });
}

async function checkHttpEndpoint(url, timeoutMs = 2000) {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(timeoutMs),
      // Remove the custom header to avoid CORS issues with external fonts
    });
    return response.ok;
  } catch {
    return false;
  }
}

module.exports = async () => {
  const isCI = !!process.env.CI;
  console.log(
    `🎭 Playwright Global Setup - ${isCI ? 'CI' : 'Local'} Environment`
  );

  // Set environment variables for Playwright tests
  process.env.PLAYWRIGHT_TEST = 'true';
  process.env.NODE_ENV = 'test';
  // Use localhost for seeding script (runs on host), mongo for app (runs in Docker)
  process.env.MONGODB_URI = 'mongodb://localhost:27017';

  console.log('🐳 Checking Docker services...');

  // Check if docker-compose services are running
  try {
    const output = execSync('docker compose ps --format json', {
      encoding: 'utf8',
    });
    const services = JSON.parse(`[${output.trim().split('\n').join(',')}]`);
    const runningServices = services.filter(s => s.State === 'running');

    if (runningServices.length === 0) {
      console.log('🚀 Starting Docker services...');
      execSync('docker compose up -d mongo datadog-agent datablog', {
        stdio: 'inherit',
      });
      console.log('✅ Docker services started');
    } else {
      console.log(`✅ Found ${runningServices.length} running services`);
    }
  } catch {
    console.log('🚀 Starting Docker services (first time setup)...');
    execSync('docker compose up -d mongo datadog-agent datablog', {
      stdio: 'inherit',
    });
    console.log('✅ Docker services started');
  }

  // Wait for MongoDB to be ready
  console.log('⏳ Waiting for MongoDB...');
  const mongoHost = '127.0.0.1';
  const mongoPort = 27017;

  for (let i = 0; i < 30; i++) {
    if (await checkPort(mongoHost, mongoPort, 1000)) {
      console.log('✅ MongoDB is ready');
      break;
    }
    if (i === 29) {
      throw new Error('❌ MongoDB failed to start within 30 seconds');
    }
    await wait(1000);
  }

  // Wait for application to be ready
  console.log('⏳ Waiting for application...');
  const appUrl = 'http://localhost:3000/healthz';

  for (let i = 0; i < 60; i++) {
    if (await checkHttpEndpoint(appUrl, 1000)) {
      console.log('✅ Application is ready');
      break;
    }
    if (i === 59) {
      throw new Error('❌ Application failed to start within 60 seconds');
    }
    await wait(1000);
  }

  // Seed the database with test data
  console.log('🌱 Seeding test database...');
  try {
    execSync('node scripts/seed-data.js', {
      stdio: 'inherit',
      env: {
        ...process.env,
        PLAYWRIGHT_TEST: 'true',
        NODE_ENV: 'test',
        MONGODB_URI: 'mongodb://localhost:27017',
      },
    });
    console.log('✅ Database seeded successfully');
  } catch (error) {
    console.warn(
      '⚠️ Warning: Database seeding failed, tests may not have expected data'
    );
    console.warn(error.message);
  }

  console.log('🎯 Playwright setup complete - services ready for testing');
};
