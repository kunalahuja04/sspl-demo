export const environment = {
  production: false,
  /**
   * Base URL for the SSPL Core Banking & Auth APIs.
   * When switching to real backend, simply update this URL and set `useMockApi: false`.
   */
  apiBaseUrl: 'https://api.ssplbank.internal/api/v1',
  /**
   * When true, requests are intercepted by `MockApiInterceptor` with simulated delay.
   * Toggle to false to route all HTTP calls to the live `apiBaseUrl`.
   */
  useMockApi: true,
  /**
   * Simulated network delay in milliseconds for mock responses.
   */
  mockDelayMs: 400,
  apiVersion: 'v1',
  appVersion: '1.0.0'
};
