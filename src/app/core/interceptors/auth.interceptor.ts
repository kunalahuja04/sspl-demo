import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DeviceInfoService } from '../services/device-info.service';

/**
 * Authentication and Request Header Interceptor.
 * - Prepends apiBaseUrl for relative paths
 * - Injects Bearer token and Session token
 * - Attaches device tracking headers
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

  // 2. Read stored tokens from storage or memory
  let accessToken: string | null = null;
  let sessionToken: string | null = null;

  try {
    accessToken =
      sessionStorage.getItem('sspl_access_token') || localStorage.getItem('sspl_access_token');
    sessionToken =
      sessionStorage.getItem('sspl_session_token') || localStorage.getItem('sspl_session_token');
  } catch {
    // Storage access fallback
  }

  // 3. Build headers
  let headers = req.headers;

  if (accessToken && !headers.has('Authorization')) {
    headers = headers.set('Authorization', `Bearer ${accessToken}`);
  }

  if (sessionToken && !headers.has('X-Session-Token')) {
    headers = headers.set('X-Session-Token', sessionToken);
  }

  // Inject device & tracking headers if missing
  const deviceInfo = deviceInfoService.getDeviceInfo();
  if (!headers.has('X-Device-Id')) {
    headers = headers.set('X-Device-Id', deviceInfo.deviceId);
  }

  // Clone request with updated URL & headers
  const authReq = req.clone({
    url: finalUrl,
    headers,
  });

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        console.warn('[AuthInterceptor] 401 Unauthorized encountered. Session or Token expired.');
        // Can trigger token refresh or session termination here
      }
      return throwError(() => error);
    }),
  );
};
