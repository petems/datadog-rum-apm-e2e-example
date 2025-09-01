// Authentication JavaScript for Datablog

class AuthManager {
  constructor() {
    this.accessToken = localStorage.getItem('accessToken');
    this.init();
  }

  init() {
    // Check if user is already logged in
    if (this.accessToken) {
      this.validateToken();
    }

    // Bind event listeners (guard against missing elements)
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', e => this.handleLogin(e));
    }
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', e => this.handleLogout(e));
    }

    // Close modal on successful login
    const loginModal = document.getElementById('loginModal');
    if (loginModal) {
      loginModal.addEventListener('hidden.bs.modal', () => {
        this.clearForm();
      });
    }
  }

  async validateToken() {
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'same-origin',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        this.showLoggedInState(data.user);
        if (data.user && data.user.role === 'admin') {
          this.showAdminBanner();
        }
      } else {
        // Token is invalid, remove it
        this.logout();
      }
    } catch {
      // Token validation failed, logout user
      this.logout();
    }
  }

  async handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    this.showLoading(true);
    this.hideMessages();

    try {
      // First get CSRF token
      const csrfResponse = await fetch('/api/auth/csrf', { credentials: 'same-origin' });
      const csrfData = await csrfResponse.json();

      // Then login
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          'csrf-token': csrfData.csrfToken,
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store access token
        this.accessToken = data.accessToken;
        localStorage.setItem('accessToken', this.accessToken);

        // Show success and update UI
        this.showSuccess('Login successful! Redirecting...');
        setTimeout(() => {
          // Refresh the page to get updated server-side content
          window.location.reload();
        }, 1000);

        // Track login event with Datadog RUM
        if (window.DD_RUM) {
          window.DD_RUM.addAction('user_login', { email: data.user.email });
        }
      } else {
        this.showError(data.message || 'Login failed');
      }
    } catch {
      this.showError('Network error. Please try again.');
    } finally {
      this.showLoading(false);
    }
  }

  async handleLogout(event) {
    event.preventDefault();

    try {
      if (this.accessToken) {
        // Get CSRF token for logout
        const csrfResponse = await fetch('/api/auth/csrf', { credentials: 'same-origin' });
        const csrfData = await csrfResponse.json();

        // Call logout endpoint
        await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'same-origin',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'csrf-token': csrfData.csrfToken,
          },
        });
      }
    } catch (error) {
      // Logout error, continue with local cleanup
      void error;
    } finally {
      this.logout();
    }
  }

  logout() {
    this.accessToken = null;
    localStorage.removeItem('accessToken');

    // Track logout event with Datadog RUM
    if (window.DD_RUM) {
      window.DD_RUM.addAction('user_logout');
    }

    // Refresh the page to show logged-out state with server-side content
    window.location.reload();
  }

  showLoggedInState(user) {
    const loginBtn = document.getElementById('loginBtn');
    const userMenu = document.getElementById('userMenu');
    const userEmail = document.getElementById('userEmail');
    if (loginBtn) loginBtn.classList.add('d-none');
    if (userMenu) userMenu.classList.remove('d-none');
    if (userEmail) userEmail.textContent = user.email;
  }

  showLoggedOutState() {
    const loginBtn = document.getElementById('loginBtn');
    const userMenu = document.getElementById('userMenu');
    const userEmail = document.getElementById('userEmail');
    if (loginBtn) loginBtn.classList.remove('d-none');
    if (userMenu) userMenu.classList.add('d-none');
    if (userEmail) userEmail.textContent = '';
  }

  showLoading(show) {
    const spinner = document.getElementById('loginSpinner');
    const submitBtn = document.getElementById('loginSubmit');

    // Guard against missing elements to prevent runtime errors
    if (!spinner || !submitBtn) return;

    if (show) {
      spinner.classList.remove('d-none');
      submitBtn.disabled = true;
    } else {
      spinner.classList.add('d-none');
      submitBtn.disabled = false;
    }
  }

  showError(message) {
    const errorDiv = document.getElementById('loginError');
    if (!errorDiv) return;
    errorDiv.textContent = message;
    errorDiv.classList.remove('d-none');
  }

  showSuccess(message) {
    const successDiv = document.getElementById('loginSuccess');
    if (!successDiv) return;
    successDiv.textContent = message;
    successDiv.classList.remove('d-none');
  }

  hideMessages() {
    const err = document.getElementById('loginError');
    const ok = document.getElementById('loginSuccess');
    if (err) err.classList.add('d-none');
    if (ok) ok.classList.add('d-none');
  }

  clearForm() {
    const form = document.getElementById('loginForm');
    if (form) form.reset();
    this.hideMessages();
  }

  showAdminBanner() {
    if (document.getElementById('adminBanner')) return;
    // Target the first container immediately following the nav (main header)
    const container =
      document.querySelector('nav + .container') ||
      document.querySelectorAll('.container')[1] ||
      document.querySelector('.container') ||
      document.body;
    const banner = document.createElement('div');
    banner.id = 'adminBanner';
    banner.className = 'alert alert-success d-flex align-items-center my-3';
    banner.setAttribute('role', 'alert');
    banner.innerHTML = '✅ <strong class="ms-2">Admin Mode:</strong> You can view all users\' pages.';
    container.prepend(banner);
  }
}

// Initialize auth manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new AuthManager();
});
