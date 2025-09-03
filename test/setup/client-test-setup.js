// Client-side test setup for happy-dom environment

// Mock console methods to reduce noise during tests
global.console = {
  ...console,
  // Uncomment to ignore log outputs
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};

// Mock global browser APIs that might be used
global.window = window;
global.document = document;

// Setup default DOM structure if needed
beforeEach(() => {
  // Clear any existing DOM content
  document.body.innerHTML = '';
  document.head.innerHTML = '';

  // Add basic meta tags that might be expected
  const metaCharset = document.createElement('meta');
  metaCharset.setAttribute('charset', 'UTF-8');
  document.head.appendChild(metaCharset);

  const metaViewport = document.createElement('meta');
  metaViewport.setAttribute('name', 'viewport');
  metaViewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
  document.head.appendChild(metaViewport);
});

// Bootstrap CSS classes work natively in happy-dom, no need to mock
// DOM methods work natively in happy-dom, no need to mock them
