/**
 * @jest-environment jsdom
 */

// Test constants to avoid hardcoded passwords
const TEST_PASSWORD = 'test-password-123';
const TEST_EMAIL = 'test@example.com';
const WRONG_PASSWORD = 'wrong-test-password';

// Mock fetch globally
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock location.reload
const mockReload = jest.fn();
delete window.location;
window.location = { reload: mockReload };

describe('AuthManager RUM Integration', () => {
  let AuthManager;
  let authManager;
  let mockDD_RUM;

  beforeAll(() => {
    // Mock DD_RUM
    mockDD_RUM = {
      setUser: jest.fn(),
      clearUser: jest.fn(),
      addAction: jest.fn(),
    };
    window.DD_RUM = mockDD_RUM;

    // Load the AuthManager class from the refactored auth.js
    AuthManager = require('../auth.js');
  });

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    mockReload.mockClear();

    // Mock setTimeout to execute callback immediately
    global.setTimeout = jest.fn(callback => callback());

    // Re-create DOM elements
    document.body.innerHTML = `
      <form id="loginForm">
        <input id="email" type="email" />
        <input id="password" type="password" />
        <button id="loginSubmit" type="submit">Login</button>
        <div id="loginSpinner" class="d-none"></div>
        <div id="loginError" class="d-none"></div>
        <div id="loginSuccess" class="d-none"></div>
      </form>
      <button id="loginBtn">Login</button>
      <button id="logoutBtn">Logout</button>
      <div id="userMenu" class="d-none">
        <span id="userEmail"></span>
      </div>
      <div id="loginModal"></div>
    `;

    // Create new AuthManager instance
    authManager = new AuthManager();
  });

  describe('Login Success - RUM Integration', () => {
    test('should set user data in RUM on successful login', async () => {
      const mockUserData = {
        user: {
          id: 'user123',
          email: 'test@example.com',
          role: 'admin',
        },
        accessToken: 'mock-access-token',
      };

      // Mock CSRF token fetch
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ csrfToken: 'mock-csrf-token' }),
        })
        // Mock login request
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUserData),
        });

      // Set up form values
      document.getElementById('email').value = TEST_EMAIL;
      document.getElementById('password').value = TEST_PASSWORD;

      // Trigger login
      const event = new Event('submit', { bubbles: true });
      event.preventDefault = jest.fn();

      await authManager.handleLogin(event);

      // Verify RUM setUser was called with correct data
      expect(mockDD_RUM.setUser).toHaveBeenCalledWith({
        id: 'user123',
        email: 'test@example.com',
        name: 'test@example.com',
        role: 'admin',
      });

      // Verify RUM addAction was called for login tracking
      expect(mockDD_RUM.addAction).toHaveBeenCalledWith('user_login', {
        email: 'test@example.com',
        role: 'admin',
      });

      // Verify token was stored
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'accessToken',
        'mock-access-token'
      );
    });

    test('should not call RUM methods when DD_RUM is not available', async () => {
      // Remove DD_RUM
      delete window.DD_RUM;

      const mockUserData = {
        user: {
          id: 'user123',
          email: 'test@example.com',
          role: 'user',
        },
        accessToken: 'mock-access-token',
      };

      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ csrfToken: 'mock-csrf-token' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUserData),
        });

      document.getElementById('email').value = TEST_EMAIL;
      document.getElementById('password').value = TEST_PASSWORD;

      const event = new Event('submit', { bubbles: true });
      event.preventDefault = jest.fn();

      await authManager.handleLogin(event);

      // Should not throw error and should still store token
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'accessToken',
        'mock-access-token'
      );

      // Restore DD_RUM for other tests
      window.DD_RUM = mockDD_RUM;
    });
  });

  describe('Token Validation - RUM Integration', () => {
    test('should set user data in RUM on successful token validation', async () => {
      const mockUserData = {
        user: {
          id: 'user456',
          email: 'validated@example.com',
          role: 'user',
        },
      };

      localStorageMock.getItem.mockReturnValue('valid-token');
      authManager.accessToken = 'valid-token';

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUserData),
      });

      await authManager.validateToken();

      expect(mockDD_RUM.setUser).toHaveBeenCalledWith({
        id: 'user456',
        email: 'validated@example.com',
        name: 'validated@example.com',
        role: 'user',
      });
    });

    test('should not set user data when validation fails', async () => {
      localStorageMock.getItem.mockReturnValue('invalid-token');
      authManager.accessToken = 'invalid-token';

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      await authManager.validateToken();

      expect(mockDD_RUM.setUser).not.toHaveBeenCalled();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('accessToken');
    });

    test('should handle network errors during token validation', async () => {
      localStorageMock.getItem.mockReturnValue('some-token');
      authManager.accessToken = 'some-token';

      fetch.mockRejectedValueOnce(new Error('Network error'));

      await authManager.validateToken();

      expect(mockDD_RUM.setUser).not.toHaveBeenCalled();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('accessToken');
    });
  });

  describe('Logout - RUM Integration', () => {
    test('should clear user data in RUM on logout', async () => {
      authManager.accessToken = 'some-token';
      localStorageMock.getItem.mockReturnValue('some-token');

      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ csrfToken: 'mock-csrf-token' }),
        })
        .mockResolvedValueOnce({
          ok: true,
        });

      const event = new Event('click', { bubbles: true });
      event.preventDefault = jest.fn();

      await authManager.handleLogout(event);

      expect(mockDD_RUM.clearUser).toHaveBeenCalled();
      expect(mockDD_RUM.addAction).toHaveBeenCalledWith('user_logout');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('accessToken');
      expect(mockReload).toHaveBeenCalled();
    });

    test('should clear user data even when logout API call fails', async () => {
      authManager.accessToken = 'some-token';
      localStorageMock.getItem.mockReturnValue('some-token');

      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ csrfToken: 'mock-csrf-token' }),
        })
        .mockRejectedValueOnce(new Error('Network error'));

      const event = new Event('click', { bubbles: true });
      event.preventDefault = jest.fn();

      await authManager.handleLogout(event);

      expect(mockDD_RUM.clearUser).toHaveBeenCalled();
      expect(mockDD_RUM.addAction).toHaveBeenCalledWith('user_logout');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('accessToken');
    });

    test('should handle logout when no token exists', async () => {
      authManager.accessToken = null;
      localStorageMock.getItem.mockReturnValue(null);

      authManager.logout();

      expect(mockDD_RUM.clearUser).toHaveBeenCalled();
      expect(mockDD_RUM.addAction).toHaveBeenCalledWith('user_logout');
      expect(mockReload).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('should handle login errors gracefully without affecting RUM calls', async () => {
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ csrfToken: 'mock-csrf-token' }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ message: 'Invalid credentials' }),
        });

      document.getElementById('email').value = TEST_EMAIL;
      document.getElementById('password').value = WRONG_PASSWORD;

      const event = new Event('submit', { bubbles: true });
      event.preventDefault = jest.fn();

      await authManager.handleLogin(event);

      expect(mockDD_RUM.setUser).not.toHaveBeenCalled();
      expect(mockDD_RUM.addAction).not.toHaveBeenCalled();

      const errorDiv = document.getElementById('loginError');
      expect(errorDiv.textContent).toBe('Invalid credentials');
      expect(errorDiv.classList.contains('d-none')).toBe(false);
    });
  });

  describe('Admin Role Handling', () => {
    test('should handle admin role correctly in RUM data', async () => {
      const mockAdminData = {
        user: {
          id: 'admin123',
          email: 'admin@example.com',
          role: 'admin',
        },
      };

      localStorageMock.getItem.mockReturnValue('admin-token');
      authManager.accessToken = 'admin-token';

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAdminData),
      });

      await authManager.validateToken();

      expect(mockDD_RUM.setUser).toHaveBeenCalledWith({
        id: 'admin123',
        email: 'admin@example.com',
        name: 'admin@example.com',
        role: 'admin',
      });

      // Check that admin banner would be shown (DOM manipulation)
      expect(document.querySelector('#adminBanner')).toBeTruthy();
    });
  });
});
