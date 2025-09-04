export async function withCsrf(fn) {
  const res = await fetch('/api/auth/csrf');
  const { csrfToken } = await res.json();
  return fn(csrfToken);
}

export async function register(email, password) {
  return withCsrf(async csrf =>
    fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'csrf-token': csrf },
      body: JSON.stringify({ email, password }),
    })
  );
}

export async function login(email, password) {
  return withCsrf(async csrf =>
    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'csrf-token': csrf },
      body: JSON.stringify({ email, password }),
    })
  );
}

export async function logout() {
  return withCsrf(async csrf =>
    fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'csrf-token': csrf },
    })
  );
}

export async function getCurrentUser() {
  try {
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch('/api/auth/me', { headers });
    return res;
  } catch (error) {
    console.error('Error getting current user:', error);
    return { ok: false };
  }
}

export async function getPages() {
  const token = localStorage.getItem('token');
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch('/api/pages', { headers });
  return res;
}

export async function getPage(id) {
  const token = localStorage.getItem('token');
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`/api/page/${id}`, { headers });
  return res.json();
}

export async function createPage(title, content) {
  return withCsrf(async csrf => {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json', 'csrf-token': csrf };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return fetch('/api/pages', {
      method: 'POST',
      headers,
      body: JSON.stringify({ title, content }),
    });
  });
}

export async function updatePage(id, title, content) {
  return withCsrf(async csrf => {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json', 'csrf-token': csrf };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return fetch(`/api/page/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ title, content }),
    });
  });
}

export async function deletePage(id) {
  return withCsrf(async csrf => {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json', 'csrf-token': csrf };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return fetch(`/api/page/${id}`, {
      method: 'DELETE',
      headers,
    });
  });
}
