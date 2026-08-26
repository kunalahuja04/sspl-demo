import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
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
  private http = inject(HttpClient);
  private requestBuilder = inject(ApiRequestBuilderService);

  private currentSession: SessionTokenResponse | null = null;

  /**
   * Generates a new secure banking session token through HttpClient.
   * Sends the standard ApiRequest envelope with device info & requestNo.
   * On success, captures the Authorization HTTP response header, captcha, noise lines, and txnId.
   */
  generateSessionToken(): Observable<SessionTokenResponse> {
    const requestPayload: GenerateSessionTokenRequest = this.requestBuilder.buildRequest({});

    return this.http
      .post<GenerateSessionTokenResponse>(
        API_ENDPOINTS.AUTH.GENERATE_SESSION_TOKEN,
        requestPayload,
        { observe: 'response' },
      )
      .pipe(
        map((httpResponse: HttpResponse<GenerateSessionTokenResponse>) => {
          const authHeader =
            httpResponse.headers.get('Authorization') ||
            httpResponse.headers.get('authorization') ||
            '';
          const response = httpResponse.body;
          const body: GenerateSessionTokenResponseBody = response?.body || {};
          const header = response?.header;

          const sessionToken = authHeader || body.sessionToken || 'SSPL-SES-DEFAULT';

          const sessionData: SessionTokenResponse = {
            sessionToken,
            expiresAt: body.expiresAt || (Date.now() + 15 * 60 * 1000),
            captchaCode: body.captchaCode || 'TCWYXg',
            noiseLines: body.noiseLines || [],
            txnId: header?.txnId,
            requestNo: header?.requestNo,
          };

          return sessionData;
        }),
        tap((sessionData: SessionTokenResponse) => {
          this.currentSession = sessionData;
          try {
            sessionStorage.setItem('sspl_auth_token', sessionData.sessionToken);
            sessionStorage.setItem('sspl_session_token', sessionData.sessionToken);
            sessionStorage.setItem(
              'sspl_access_token',
              sessionData.sessionToken.replace(/^Bearer\s+/i, ''),
            );
            if (sessionData.txnId) {
              sessionStorage.setItem('sspl_last_txn_id', sessionData.txnId);
            }
          } catch {
            // Storage access fallback
          }
        }),
      );
  }

  getCurrentSession(): SessionTokenResponse | null {
    return this.currentSession;
  }

  validateCaptcha(userInput: string): boolean {
    if (!this.currentSession || !this.currentSession.captchaCode) {
      return false;
    }
    return userInput.trim().toLowerCase() === this.currentSession.captchaCode.toLowerCase();
  }
}
