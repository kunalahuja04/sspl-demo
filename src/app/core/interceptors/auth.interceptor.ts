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
 * - Injects raw Authorization HTTP Header into subsequent requests (no Bearer prefix)
 * - Injects Accept-Language header
 * - Captures fresh Authorization HTTP headers from responses
 * - Attaches device tracking headers (X-Device-Id)
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

  // 3. Attach raw Authorization & Accept-Language headers to request's HttpHeaders if available
  let headers = req.headers;

  if (authToken && !headers.has('Authorization') && !headers.has('authorization')) {
    headers = headers.set('authorization', authToken);
  }

  if (!headers.has('Accept-Language') && !headers.has('accept-language')) {
    headers = headers.set('Accept-Language', 'en_US');
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
          event.headers.get('Authorization') ||
          event.headers.get('authorization') ||
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
