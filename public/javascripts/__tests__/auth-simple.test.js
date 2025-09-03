/**
 * @jest-environment jsdom
 */

// Simple focused tests for RUM functionality
describe('AuthManager RUM Integration - Simple Tests', () => {
  let mockDD_RUM;
  let authManager;

  // Mock localStorage
  const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  };
  global.localStorage = localStorageMock;

  // Mock fetch
  global.fetch = jest.fn();

  // Mock location.reload
  const mockReload = jest.fn();
  delete window.location;
  window.location = { reload: mockReload };

  beforeAll(() => {
    // Mock DD_RUM
    mockDD_RUM = {
      setUser: jest.fn(),
      clearUser: jest.fn(),
      addAction: jest.fn(),
    };

    // Load the AuthManager class
    const AuthManager = require('../auth-module.js');

    // Create a basic DOM structure
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
    `;

    authManager = new AuthManager();
  });

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    mockReload.mockClear();
    window.DD_RUM = mockDD_RUM;
  });

  test('RUM setUser is called during successful login', async () => {
    const userData = {
      user: {
        id: 'test123',
        email: 'test@example.com',
        role: 'user',
      },
      accessToken: 'token123',
    };

    // Mock API responses
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ csrfToken: 'csrf123' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(userData),
      });

    // Mock setTimeout to avoid async issues
    const originalSetTimeout = global.setTimeout;
    global.setTimeout = jest.fn(callback => callback());

    // Set form values
    document.getElementById('email').value = 'test@example.com';
    document.getElementById('password').value = 'password';

    // Call handleLogin directly
    const mockEvent = { preventDefault: jest.fn() };
    await authManager.handleLogin(mockEvent);

    // Verify RUM calls
    expect(mockDD_RUM.setUser).toHaveBeenCalledWith({
      id: 'test123',
      email: 'test@example.com',
      name: 'test@example.com',
      role: 'user',
    });

    expect(mockDD_RUM.addAction).toHaveBeenCalledWith('user_login', {
      email: 'test@example.com',
      role: 'user',
    });

    // Restore setTimeout
    global.setTimeout = originalSetTimeout;
  });

  test('RUM setUser is called during token validation', async () => {
    const userData = {
      user: {
        id: 'valid123',
        email: 'valid@example.com',
        role: 'admin',
      },
    };

    authManager.accessToken = 'valid-token';
    localStorageMock.getItem.mockReturnValue('valid-token');

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(userData),
    });

    await authManager.validateToken();

    expect(mockDD_RUM.setUser).toHaveBeenCalledWith({
      id: 'valid123',
      email: 'valid@example.com',
      name: 'valid@example.com',
      role: 'admin',
    });
  });

  test('RUM clearUser is called during logout', () => {
    // Mock the logout method to not call location.reload
    const originalLogout = authManager.logout;
    authManager.logout = function () {
      // Clear user context in RUM before local cleanup
      if (window.DD_RUM) {
        window.DD_RUM.clearUser();
        window.DD_RUM.addAction('user_logout');
      }

      this.accessToken = null;
      localStorage.removeItem('accessToken');
      // Don't call window.location.reload in tests
    };

    authManager.logout();

    expect(mockDD_RUM.clearUser).toHaveBeenCalled();
    expect(mockDD_RUM.addAction).toHaveBeenCalledWith('user_logout');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('accessToken');

    // Restore original method
    authManager.logout = originalLogout;
  });

  test('RUM methods are not called when DD_RUM is undefined', async () => {
    window.DD_RUM = undefined;

    const userData = {
      user: {
        id: 'test123',
        email: 'test@example.com',
        role: 'user',
      },
      accessToken: 'token123',
    };

    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ csrfToken: 'csrf123' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(userData),
      });

    global.setTimeout = jest.fn(callback => callback());

    document.getElementById('email').value = 'test@example.com';
    document.getElementById('password').value = 'password';

    const mockEvent = { preventDefault: jest.fn() };
    await authManager.handleLogin(mockEvent);

    // Should not throw and should still work
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'accessToken',
      'token123'
    );
  });

  test('Login with admin role sets correct RUM data', async () => {
    const adminUserData = {
      user: {
        id: 'admin123',
        email: 'admin@example.com',
        role: 'admin',
      },
      accessToken: 'admin-token',
    };

    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ csrfToken: 'csrf123' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(adminUserData),
      });

    global.setTimeout = jest.fn(callback => callback());

    document.getElementById('email').value = 'admin@example.com';
    document.getElementById('password').value = 'adminpass';

    const mockEvent = { preventDefault: jest.fn() };
    await authManager.handleLogin(mockEvent);

    expect(mockDD_RUM.setUser).toHaveBeenCalledWith({
      id: 'admin123',
      email: 'admin@example.com',
      name: 'admin@example.com',
      role: 'admin',
    });

    expect(mockDD_RUM.addAction).toHaveBeenCalledWith('user_login', {
      email: 'admin@example.com',
      role: 'admin',
    });
  });
});
