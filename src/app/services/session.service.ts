import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, ReplaySubject, map, of, tap } from 'rxjs';

import { API_ENDPOINTS } from '../core/config/api-endpoints';
import { ApiRequestBuilderService } from '../core/services/api-request-builder.service';

import {
  GenerateSessionTokenRequest,
  GenerateSessionTokenResponse,
  GenerateSessionTokenResponseBody,
  CaptchaNoiseLine,
} from '../models';

export interface SessionTokenResponse {
  sessionToken: string;
  expiresAt: number;
  captchaCode: string;
  noiseLines: CaptchaNoiseLine[];
  txnId?: string;
  requestNo?: string;
}

@Injectable({
  providedIn: 'root',
})
export class SessionService {
  private readonly http = inject(HttpClient);

  private readonly requestBuilder = inject(ApiRequestBuilderService);

  private currentSession: SessionTokenResponse | null = null;

  private readonly authorizationTokenSubject = new BehaviorSubject<string | null>(
    this.readStoredAuthorizationToken(),
  );

  readonly authorizationToken$: Observable<string | null> =
    this.authorizationTokenSubject.asObservable();

  generateSessionToken(): Observable<SessionTokenResponse> {
    /*
     * Important:
     * If this calls clearSession(), the BehaviorSubject becomes null
     * until generateSessionToken returns the new token.
     */
    this.clearSession();

    const requestPayload: GenerateSessionTokenRequest = this.requestBuilder.buildRequest({});

    return this.http
      .post<GenerateSessionTokenResponse>(
        API_ENDPOINTS.SECURITY.GENERATE_SESSION_TOKEN,
        requestPayload,
        {
          observe: 'response',
        },
      )
      .pipe(
        map((httpResponse: HttpResponse<GenerateSessionTokenResponse>): SessionTokenResponse => {
          const authorizationHeader = httpResponse.headers.get('Authorization');
          const response = httpResponse.body;
          const body: GenerateSessionTokenResponseBody = response?.body ?? {};
          const responseHeader = response?.header;
          /*
           * If mock mode has its own fallback, keep that logic here.
           * For a real API, never store a default fake token.
           */
          const sessionToken = authorizationHeader ?? body.sessionToken;
          if (!sessionToken) {
            throw new Error(
              'Authorization token is missing from the ' + 'generateSessionToken response.',
            );
          }
          return {
            sessionToken: sessionToken.trim(),
            expiresAt: body.expiresAt ?? Date.now() + 15 * 60 * 1000,
            captchaCode: ['TCWYXG', 'QWETRS', 'Q23ASX', 'A12VSA'].at((Math.random() * 4) | 0) ?? '',
            noiseLines: body.noiseLines ?? [],
            txnId: responseHeader?.txnId,
            requestNo: responseHeader?.requestNo,
          };
        }),
        tap((sessionData: SessionTokenResponse) => {
          this.currentSession = sessionData;
          this.setAuthorizationToken(sessionData.sessionToken);
          if (sessionData.txnId) {
            try {
              sessionStorage.setItem('sspl_last_txn_id', sessionData.txnId);
            } catch {
              // Storage may be unavailable.
            }
          }
        }),
      );
  }

  getCurrentSession(): SessionTokenResponse | null {
    return this.currentSession;
  }

  getAuthorizationToken(): string | null {
    return this.authorizationTokenSubject.value;
  }

  setAuthorizationToken(token: string): void {
    const normalizedToken = token.trim();

    if (!normalizedToken) {
      return;
    }
    /*
     * Replaces token A with token B after login.
     */
    this.authorizationTokenSubject.next(normalizedToken);

    if (this.currentSession) {
      this.currentSession = {
        ...this.currentSession,
        sessionToken: normalizedToken,
      };
    }
    try {
      sessionStorage.setItem('sspl_auth_token', normalizedToken);
      sessionStorage.setItem('sspl_session_token', normalizedToken);
      sessionStorage.setItem('sspl_access_token', normalizedToken);
    } catch (error) {
      console.warn('[SessionService] Token storage failed.', error);
    }
  }

  clearSession(): void {
    this.currentSession = null;
    this.authorizationTokenSubject.next(null);
    try {
      sessionStorage.removeItem('sspl_auth_token');
      sessionStorage.removeItem('sspl_session_token');
      sessionStorage.removeItem('sspl_access_token');
      sessionStorage.removeItem('sspl_last_txn_id');
      localStorage.removeItem('sspl_auth_token');
      localStorage.removeItem('sspl_session_token');
      localStorage.removeItem('sspl_access_token');
    } catch {
      // Storage may be unavailable.
    }
  }

  validateCaptcha(userInput: string): boolean {
    const captchaCode = this.currentSession?.captchaCode;
    if (!captchaCode) {
      return false;
    }
    return userInput.trim().toLowerCase() === captchaCode.toLowerCase();
  }
  private readStoredAuthorizationToken(): string | null {
    try {
      return (
        sessionStorage.getItem('sspl_auth_token') ??
        sessionStorage.getItem('sspl_session_token') ??
        sessionStorage.getItem('sspl_access_token') ??
        localStorage.getItem('sspl_auth_token') ??
        localStorage.getItem('sspl_session_token') ??
        localStorage.getItem('sspl_access_token')
      );
    } catch {
      return null;
    }
  }
}
