import { datadogRum } from '@datadog/browser-rum';

// RUM user tracking utilities
export function setRumUser(user) {
  if (user) {
    try {
      // Use the modern SDK API instead of window.DD_RUM
      datadogRum.setUser({
        id: user.id,
        email: user.email,
        name: user.email, // Use email as display name
        role: user.role,
      });
    } catch (error) {
      console.warn('Failed to set RUM user:', error);
    }
  }
}

export function clearRumUser() {
  try {
    // Track logout action first while user context is still available
    datadogRum.addAction('user_logout');
    // Then clear user information
    datadogRum.clearUser();
  } catch (error) {
    console.warn('Failed to clear RUM user:', error);
  }
}

export function trackLoginEvent(user) {
  if (user) {
    try {
      datadogRum.addAction('user_login', {
        email: user.email,
        role: user.role,
      });
    } catch (error) {
      console.warn('Failed to track RUM login event:', error);
    }
  }
}
