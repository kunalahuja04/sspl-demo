/**
 * Standard API Envelope Models for SSPL Bank APIs.
 * Enforces structured header and payload separation across all requests and responses.
 */

export interface DeviceInfo {
  deviceId?: string;
  os?: string;
  osVersion?: string;
  browser?: string;
  browserVersion?: string;
  appVersion?: string;
  ipAddress?: string;
}

export interface ApiRequestHeader {
  requestNo: string;
  deviceInfo: DeviceInfo;
}

export interface ApiResponseHeader {
  requestNo: string;
  status: 'success' | 'failed' | 'error';
  txnId: string;
  responseCode?: string;
  message?: string;
  errorCode?: string;
  errorMessage?: string;
}

export interface ApiRequest<TBody = Record<string, unknown>> {
  header: ApiRequestHeader;
  body: TBody;
}

export interface ApiResponse<TBody = Record<string, unknown>> {
  header: ApiResponseHeader;
  body?: TBody;
}

