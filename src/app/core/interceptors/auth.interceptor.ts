import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpResponse,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DeviceInfoService } from '../services/device-info.service';

/**
 * Authentication and Request Header Interceptor.
 * - Prepends apiBaseUrl for relative paths
 * - Injects standard banking HTTP headers for all requests starting from generateSessionToken:
 *     channelkey: WEB
 *     channelver: v1.0
 *     content-type: application/json
 *     Accept-Language: en_US
 *     authorization: <token> (if available, raw without Bearer prefix)
 *     X-Device-Id: <deviceId>
 * - Captures fresh raw Authorization HTTP headers from responses
 * - Handles unauthorized 401 responses
 */
export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  const deviceInfoService = inject(DeviceInfoService);

  // 1. Resolve full URL if relative
  let finalUrl = req.url;
  if (
    !req.url.startsWith('http://') &&
    !req.url.startsWith('https://') &&
    !req.url.startsWith('assets/')
  ) {
    const base = environment.apiBaseUrl.replace(/\/+$/, '');
    const path = req.url.startsWith('/') ? req.url : `/${req.url}`;
    finalUrl = `${base}${path}`;
  }

  // 2. Read stored Authorization token from storage
  let authToken: string | null = null;
  try {
    authToken =
      sessionStorage.getItem('sspl_auth_token') ||
      sessionStorage.getItem('sspl_access_token') ||
      sessionStorage.getItem('sspl_session_token') ||
      localStorage.getItem('sspl_auth_token') ||
      localStorage.getItem('sspl_access_token') ||
      localStorage.getItem('sspl_session_token');
  } catch {
    // Storage access fallback
  }

  // 3. Attach standard banking HTTP headers
  let headers = req.headers;

  if (!headers.has('channelkey') && !headers.has('ChannelKey')) {
    headers = headers.set('channelkey', 'WEB');
  }

  if (!headers.has('channelver') && !headers.has('ChannelVer')) {
    headers = headers.set('channelver', 'v1.0');
  }

  if (!headers.has('content-type') && !headers.has('Content-Type')) {
    headers = headers.set('content-type', 'application/json');
  }

  if (!headers.has('Accept-Language') && !headers.has('accept-language')) {
    headers = headers.set('Accept-Language', 'en_US');
  }

  if (authToken && !headers.has('authorization') && !headers.has('Authorization')) {
    headers = headers.set('authorization', authToken);
  }

  // Inject device & tracking headers if missing
  const deviceInfo = deviceInfoService.getDeviceInfo();
  if (!headers.has('X-Device-Id') && deviceInfo.deviceId) {
    headers = headers.set('X-Device-Id', deviceInfo.deviceId);
  }

  // Clone request with updated URL & headers
  const authReq = req.clone({
    url: finalUrl,
    headers,
  });

  return next(authReq).pipe(
    tap((event: HttpEvent<unknown>) => {
      // 4. Capture fresh raw Authorization header returned in HTTP response
      if (event instanceof HttpResponse) {
        const incomingAuth =
          event.headers.get('authorization') ||
          event.headers.get('Authorization') ||
          event.headers.get('X-Auth-Token') ||
          event.headers.get('x-auth-token');

        if (incomingAuth) {
          try {
            sessionStorage.setItem('sspl_auth_token', incomingAuth);
            sessionStorage.setItem('sspl_access_token', incomingAuth);
            sessionStorage.setItem('sspl_session_token', incomingAuth);
          } catch {
            // Storage access fallback
          }
        }
      }
    }),
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        console.warn('[AuthInterceptor] 401 Unauthorized encountered. Session or Token expired.');
      }
      return throwError(() => error);
    }),
  );
};
