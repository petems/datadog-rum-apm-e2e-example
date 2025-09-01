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

    // Bind event listeners
    document
      .getElementById('loginForm')
      .addEventListener('submit', e => this.handleLogin(e));
    document
      .getElementById('logoutBtn')
      .addEventListener('click', e => this.handleLogout(e));

    // Close modal on successful login
    document
      .getElementById('loginModal')
      .addEventListener('hidden.bs.modal', () => {
        this.clearForm();
      });
  }

  async validateToken() {
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        this.showLoggedInState(data.user);
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
      const csrfResponse = await fetch('/api/auth/csrf');
      const csrfData = await csrfResponse.json();

      // Then login
      const response = await fetch('/api/auth/login', {
        method: 'POST',
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
        const csrfResponse = await fetch('/api/auth/csrf');
        const csrfData = await csrfResponse.json();

        // Call logout endpoint
        await fetch('/api/auth/logout', {
          method: 'POST',
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
    document.getElementById('loginBtn').classList.add('d-none');
    document.getElementById('userMenu').classList.remove('d-none');
    document.getElementById('userEmail').textContent = user.email;
  }

  showLoggedOutState() {
    document.getElementById('loginBtn').classList.remove('d-none');
    document.getElementById('userMenu').classList.add('d-none');
    document.getElementById('userEmail').textContent = '';
  }

  showLoading(show) {
    const spinner = document.getElementById('loginSpinner');
    const submitBtn = document.getElementById('loginSubmit');

    if (show) {
      spinner.classList.remove('d-none');
      submitBtn.disabled = true;
      submitBtn.textContent = ' Logging in...';
    } else {
      spinner.classList.add('d-none');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Login';
    }
  }

  showError(message) {
    const errorDiv = document.getElementById('loginError');
    errorDiv.textContent = message;
    errorDiv.classList.remove('d-none');
  }

  showSuccess(message) {
    const successDiv = document.getElementById('loginSuccess');
    successDiv.textContent = message;
    successDiv.classList.remove('d-none');
  }

  hideMessages() {
    document.getElementById('loginError').classList.add('d-none');
    document.getElementById('loginSuccess').classList.add('d-none');
  }

  clearForm() {
    document.getElementById('loginForm').reset();
    this.hideMessages();
  }
}

// Initialize auth manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new AuthManager();
});
