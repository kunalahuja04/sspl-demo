export const environment = {
  production: false,
  /**
   * Base URL for the Core Banking APIs.
   * Uses TestBedGateway proxy target (http://10.10.213.33:91/TestBedGateway/API/banking).
   */
  apiBaseUrl: '/TestBedGateway/API/banking',
  /**
   * When true, requests are intercepted by `MockApiInterceptor` with simulated delay.
   * Toggle to false to route all HTTP calls to the live server via the TestBedGateway proxy.
   */
  useMockApi: false,
  /**
   * Simulated network delay in milliseconds for mock responses.
   */
  mockDelayMs: 400,
  apiVersion: 'v1',
  appVersion: '1.0.0',
};
