#!/usr/bin/env node
/* eslint-disable no-console */

// Simple Node script to log in via API using CSRF + cookies.
// Usage: node scripts/auth-login.js <email> <password> [baseUrl]

const DEFAULT_BASE = 'http://localhost:3000';

function getArg(i, def) {
  return process.argv[i] || def;
}

async function getJson(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function extractCookie(setCookies, name) {
  for (const c of setCookies) {
    const idx = c.indexOf(name + '=');
    if (idx !== -1) {
      const rest = c.slice(idx + name.length + 1);
      const val = rest.split(';')[0];
      return val;
    }
  }
  return null;
}

async function main() {
  const email = getArg(2, 'admin@example.com');
  const password = getArg(3, 'AdminPassword123');
  const baseUrl = getArg(4, DEFAULT_BASE).replace(/\/$/, '');

  console.log(`🔑 Logging in to ${baseUrl} as ${email}`);

  // 1) Fetch CSRF token and capture _csrf cookie from Set-Cookie
  const csrfRes = await fetch(`${baseUrl}/api/auth/csrf`);
  const csrfBody = await getJson(csrfRes);
  if (!csrfRes.ok || !csrfBody.csrfToken) {
    console.error('❌ Failed to fetch CSRF token', csrfBody);
    process.exit(1);
  }

  const setCookies = csrfRes.headers.getSetCookie
    ? csrfRes.headers.getSetCookie()
    : (csrfRes.headers.get('set-cookie') ? [csrfRes.headers.get('set-cookie')] : []);
  const csrfCookie = extractCookie(setCookies, '_csrf');
  if (!csrfCookie) {
    console.error('❌ No _csrf cookie set by server');
    process.exit(1);
  }

  // 2) POST login with csrf-token header and Cookie: _csrf=...
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'csrf-token': csrfBody.csrfToken,
      Cookie: `_csrf=${csrfCookie}`,
    },
    body: JSON.stringify({ email, password }),
  });
  const loginBody = await getJson(loginRes);
  if (!loginRes.ok) {
    console.error('❌ Login failed', { status: loginRes.status, body: loginBody });
    process.exit(1);
  }

  const accessToken = loginBody.accessToken;
  if (!accessToken) {
    console.error('❌ No accessToken in response', loginBody);
    process.exit(1);
  }
  console.log('✅ Login success');
  console.log(`accessToken=${accessToken}`);

  // Optional verification
  try {
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const me = await getJson(meRes);
    console.log(`me=${JSON.stringify(me)}`);
  } catch {
    // ignore
  }
}

main().catch(err => {
  console.error('❌ Unexpected error:', err?.message || err);
  process.exit(1);
});
