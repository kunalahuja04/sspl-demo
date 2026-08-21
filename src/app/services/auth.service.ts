import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';

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
  providedIn: 'root'
})
export class AuthService {
  private router = inject(Router);

  // In-memory authentication state (strictly non-authenticated until valid form login)
  private currentUserSignal = signal<User | null>(null);
  private sessionTokenSignal = signal<string | null>(null);
  readonly activeTenant = signal<string>('SSPL001');

  // Readonly signals for consumers
  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly sessionToken = this.sessionTokenSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.currentUserSignal());

  /**
   * Log in user with credentials and verified session token
   */
  login(tenant: string, customerId: string, token?: string): boolean {
    const user: User = {
      id: customerId,
      name: 'Rajesh K. Sharma',
      username: customerId,
      tenant: tenant.split('—')[0].trim() || 'SSPL001',
      lastLogin: '08 Jun, 09:41',
      avatarInitials: 'RK',
      role: 'Personal Banking'
    };

    const sessionTok = token || 'SES_' + Math.random().toString(36).substring(2, 12).toUpperCase();

    this.currentUserSignal.set(user);
    this.sessionTokenSignal.set(sessionTok);
    this.activeTenant.set(user.tenant);

    return true;
  }

  /**
   * Log out user, clear signals, and redirect to login
   */
  logout(): void {
    this.currentUserSignal.set(null);
    this.sessionTokenSignal.set(null);
    this.activeTenant.set('SSPL001');

    try {
      sessionStorage.clear();
      localStorage.clear();
    } catch (e) {
      // Ignore storage errors if any
    }

    this.router.navigate(['/login']);
  }
}
