import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';

export interface SessionTokenResponse {
  sessionToken: string;
  expiresAt: number;
  captchaCode: string;
  noiseLines: { x1: number; y1: number; x2: number; y2: number; color: string }[];
}

@Injectable({
  providedIn: 'root',
})
export class SessionService {
  private currentSession: SessionTokenResponse | null = null;

  /**
   * Generates a new secure banking session token.
   * On success of this method, the captcha data is provided to the login interface.
   */
  generateSessionToken(): Observable<SessionTokenResponse> {
    const sampleCodes = ['TCWYXg', 'K8M4Np', 'R9X2Va', 'Q5B7Zw', 'H3D9Le', 'W2Y6Fs'];
    const chosenCode = sampleCodes[Math.floor(Math.random() * sampleCodes.length)];

    const token =
      'SSPL-SES-' + Math.random().toString(36).substring(2, 8).toUpperCase() + '-' + Date.now();

    // Noise lines for captcha security simulation
    const noiseLines = [
      { x1: 5, y1: 15, x2: 135, y2: 25, color: 'rgba(13, 34, 64, 0.25)' },
      { x1: 10, y1: 30, x2: 130, y2: 10, color: 'rgba(201, 162, 39, 0.35)' },
      { x1: 20, y1: 8, x2: 120, y2: 32, color: 'rgba(13, 34, 64, 0.20)' },
    ];

    const response: SessionTokenResponse = {
      sessionToken: token,
      expiresAt: Date.now() + 15 * 60 * 1000,
      captchaCode: chosenCode,
      noiseLines: noiseLines,
    };

    this.currentSession = response;

    return of(response).pipe(delay(350));
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
