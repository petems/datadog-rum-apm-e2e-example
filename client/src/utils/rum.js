// RUM user tracking utilities
export function setRumUser(user) {
  if (window.DD_RUM && user) {
    window.DD_RUM.setUser({
      id: user.id,
      email: user.email,
      name: user.email, // Use email as display name
      role: user.role,
    });
  }
}

export function clearRumUser() {
  if (window.DD_RUM && typeof window.DD_RUM.clearUser === 'function') {
    window.DD_RUM.addAction('user_logout');
    window.DD_RUM.clearUser();
  }
}

export function trackLoginEvent(user) {
  if (window.DD_RUM && user) {
    window.DD_RUM.addAction('user_login', {
      email: user.email,
      role: user.role,
    });
  }
}
