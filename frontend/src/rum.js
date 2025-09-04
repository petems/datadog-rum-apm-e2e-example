import { datadogRum } from '@datadog/browser-rum';

export const initRum = () => {
  if (window.DD_RUM_CONFIG) {
    datadogRum.init({
      ...window.DD_RUM_CONFIG,
      allowedTracingUrls: [
        {
          match: window.location.origin,
          propagatorTypes: ["tracecontext", "datadog"],
        },
      ],
      sessionSampleRate: 100,
      sessionReplaySampleRate: 100,
      trackUserInteractions: true,
      trackResources: true,
      trackLongTask: true,
      defaultPrivacyLevel: 'mask-user-input',
    });

    datadogRum.startSessionReplayRecording();
  }
};
