import { datadogRum } from '@datadog/browser-rum';

datadogRum.init({
  applicationId: import.meta.env.VITE_DD_RUM_APP_ID,
  clientToken: import.meta.env.VITE_DD_RUM_CLIENT_TOKEN,
  site: import.meta.env.VITE_DD_SITE || 'datadoghq.com',
  service: 'datablog-ui',
  env: import.meta.env.VITE_DD_ENV,
  version: '1.0.0',
  sessionSampleRate: 100,
  sessionReplaySampleRate: 100,
  trackResources: true,
  trackLongTasks: true,
  trackUserInteractions: true,
  // Propagate trace headers so RUM resources link to backend traces
  // (match your API base; same-origin here)
  allowedTracingUrls: [
    url => url.startsWith('http://localhost'),
    url => url.startsWith('http://localhost:3000'),
  ],
  traceSampleRate: 100,
});
