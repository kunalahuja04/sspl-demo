import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, of, map } from 'rxjs';
import { API_ENDPOINTS } from '../core/config/api-endpoints';
import { ApiRequestBuilderService } from '../core/services/api-request-builder.service';
import {
  LoginRequest,
  LoginResponse,
  LoginResponseBody,
  AuthUserInfo,
  RefreshTokenRequest,
  RefreshTokenResponse,
  LogoutRequest,
  LogoutResponse,
} from '../models';

export interface User {
  id: string;
  name: string;
  username: string;
  tenant: string;
  lastLogin: string;
  avatarInitials: string;
  role: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private requestBuilder = inject(ApiRequestBuilderService);

  // Authentication State Signals
  private currentUserSignal = signal<User | null>(null);
  private sessionTokenSignal = signal<string | null>(null);
  private accessTokenSignal = signal<string | null>(null);
  private refreshTokenSignal = signal<string | null>(null);
  readonly activeTenant = signal<string>('SSPL001');

  // Readonly signals for UI consumers
  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly sessionToken = this.sessionTokenSignal.asReadonly();
  readonly accessToken = this.accessTokenSignal.asReadonly();
  readonly refreshTokenValue = this.refreshTokenSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.currentUserSignal());

  constructor() {
    this.restoreSessionFromStorage();
  }

  /**
   * Performs authentication via HTTP call with standard envelope.
   * On success, sets access token, refresh token, and user session.
   */
  login(tenant: string, customerId: string, token?: string): Observable<LoginResponseBody> {
    const tenantClean = tenant.split('—')[0].trim() || 'SSPL001';
    const requestPayload: LoginRequest = this.requestBuilder.buildRequest({
      tenantId: tenantClean,
      customerId,
      sessionToken: token,
    });

    return this.http.post<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, requestPayload).pipe(
      map((response) => {
        const body = response.body;
        if (!body) {
          throw new Error(response.header?.message || 'Login failed');
        }
        return body;
      }),
      tap((data: LoginResponseBody) => {
        this.setSession(data);
      }),
    );
  }

  /**
   * Refreshes active Access Token using Refresh Token.
   */
  refreshAccessToken(): Observable<RefreshTokenResponse> {
    const rfToken = this.refreshTokenSignal() || '';
    const sToken = this.sessionTokenSignal() || '';

    const payload: RefreshTokenRequest = this.requestBuilder.buildRequest({
      refreshToken: rfToken,
      sessionToken: sToken,
    });

    return this.http.post<RefreshTokenResponse>(API_ENDPOINTS.AUTH.REFRESH_TOKEN, payload).pipe(
      tap((res) => {
        if (res.body?.accessToken) {
          this.accessTokenSignal.set(res.body.accessToken);
          sessionStorage.setItem('sspl_access_token', res.body.accessToken);
        }
        if (res.body?.refreshToken) {
          this.refreshTokenSignal.set(res.body.refreshToken);
          sessionStorage.setItem('sspl_refresh_token', res.body.refreshToken);
        }
      }),
    );
  }

  /**
   * Log out user, invalidate tokens via API, clear storage and signals, redirect to login
   */
  logout(): void {
    const sToken = this.sessionTokenSignal() || undefined;
    const payload: LogoutRequest = this.requestBuilder.buildRequest({ sessionToken: sToken });

    this.http
      .post<LogoutResponse>(API_ENDPOINTS.AUTH.LOGOUT, payload)
      .pipe(catchError(() => of(null)))
      .subscribe();

    this.clearSession();
    this.router.navigate(['/login']);
  }

  private setSession(authData: LoginResponseBody): void {
    const user: User = {
      id: authData.user.id,
      name: authData.user.name,
      username: authData.user.username,
      tenant: authData.user.tenant,
      lastLogin: authData.user.lastLogin,
      avatarInitials: authData.user.avatarInitials,
      role: authData.user.role,
    };

    this.currentUserSignal.set(user);
    this.sessionTokenSignal.set(authData.sessionToken);
    this.accessTokenSignal.set(authData.accessToken);
    this.refreshTokenSignal.set(authData.refreshToken);
    this.activeTenant.set(user.tenant);

    try {
      sessionStorage.setItem('sspl_access_token', authData.accessToken);
      sessionStorage.setItem('sspl_refresh_token', authData.refreshToken);
      sessionStorage.setItem('sspl_session_token', authData.sessionToken);
      sessionStorage.setItem('sspl_user', JSON.stringify(user));
    } catch {
      // Storage fallback
    }
  }

  private clearSession(): void {
    this.currentUserSignal.set(null);
    this.sessionTokenSignal.set(null);
    this.accessTokenSignal.set(null);
    this.refreshTokenSignal.set(null);
    this.activeTenant.set('SSPL001');

    try {
      sessionStorage.removeItem('sspl_access_token');
      sessionStorage.removeItem('sspl_refresh_token');
      sessionStorage.removeItem('sspl_session_token');
      sessionStorage.removeItem('sspl_user');
      localStorage.removeItem('sspl_access_token');
      localStorage.removeItem('sspl_refresh_token');
      localStorage.removeItem('sspl_session_token');
      localStorage.removeItem('sspl_user');
    } catch {
      // Storage fallback
    }
  }

  private restoreSessionFromStorage(): void {
    try {
      const storedUser = sessionStorage.getItem('sspl_user') || localStorage.getItem('sspl_user');
      const storedAccessToken =
        sessionStorage.getItem('sspl_access_token') || localStorage.getItem('sspl_access_token');
      const storedSessionToken =
        sessionStorage.getItem('sspl_session_token') || localStorage.getItem('sspl_session_token');
      const storedRefreshToken =
        sessionStorage.getItem('sspl_refresh_token') || localStorage.getItem('sspl_refresh_token');

      if (storedUser && storedAccessToken) {
        const user: User = JSON.parse(storedUser);
        this.currentUserSignal.set(user);
        this.accessTokenSignal.set(storedAccessToken);
        this.sessionTokenSignal.set(storedSessionToken);
        this.refreshTokenSignal.set(storedRefreshToken);
        this.activeTenant.set(user.tenant || 'SSPL001');
      }
    } catch {
      // Ignore parsing errors
    }
  }
}
