// RUM user tracking utilities
export function setRumUser(user) {
  if (window.DD_RUM && typeof window.DD_RUM.setUser === 'function' && user) {
    window.DD_RUM.setUser({
      id: user.id,
      email: user.email,
      name: user.email, // Use email as display name
      role: user.role,
    });
  }
}

export function clearRumUser() {
  if (window.DD_RUM) {
    // Track logout action first while user context is still available
    if (typeof window.DD_RUM.addAction === 'function') {
      window.DD_RUM.addAction('user_logout');
    }
    // Then clear user information
    if (typeof window.DD_RUM.clearUser === 'function') {
      window.DD_RUM.clearUser();
    }
  }
}

export function trackLoginEvent(user) {
  if (window.DD_RUM && typeof window.DD_RUM.addAction === 'function' && user) {
    window.DD_RUM.addAction('user_login', {
      email: user.email,
      role: user.role,
    });
  }
}
