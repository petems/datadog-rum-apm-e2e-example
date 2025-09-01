const net = require('net');
const util = require('util');

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkMongo(host, port, timeoutMs = 2000) {
  return new Promise(resolve => {
    const socket = new net.Socket();
    let done = false;
    const onDone = ok => {
      if (done) return;
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

module.exports = async () => {
  const host = process.env.MONGO_HOST || '127.0.0.1';
  const port = Number(process.env.MONGO_PORT || 27017);
  const quick = process.env.PW_QUICK || '1';

  // Quick connectivity probe to speed iteration and provide hints
  const ok = await checkMongo(host, port, 1500);
  if (!ok) {
    console.warn(
      `⚠️  MongoDB not reachable at ${host}:${port}.\n` +
        `Start it quickly with:\n` +
        `  docker run -d -p 27017:27017 --name mongo mongo:7.0\n` +
        `or via compose:\n` +
        `  docker compose up -d mongo\n` +
        `Set MONGO_HOST/MONGO_PORT to override.\n`
    );
    if (quick === '1') {
      // In quick mode, don’t fail hard — allow tests to attempt and fail fast
      return;
    }
  }

  // Optionally, wait briefly for a slow-starting local Mongo
  const attempts = Number(process.env.MONGO_WAIT_ATTEMPTS || 3);
  for (let i = 0; i < attempts && !(await checkMongo(host, port, 1500)); i++) {
    await wait(500);
  }
};

