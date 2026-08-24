import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap, catchError, of } from 'rxjs';
import { API_ENDPOINTS } from '../core/config/api-endpoints';
import {
  BalanceEnquiryAccount,
  BalanceEnquiryApiResponse,
} from '../models';

@Injectable({
  providedIn: 'root',
})
export class BalanceEnquiryService {
  private http = inject(HttpClient);

  // State signals
  private accountsSignal = signal<BalanceEnquiryAccount[]>([]);
  private isLoadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);
  private correlationIdSignal = signal<string>('');
  private lastFetchedAtSignal = signal<Date | null>(null);

  // Public readonly signals
  readonly accounts = this.accountsSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly correlationId = this.correlationIdSignal.asReadonly();
  readonly lastFetchedAt = this.lastFetchedAtSignal.asReadonly();

  /**
   * POST to /dashboard/balanceEnquiry and populate the signals.
   */
  fetchBalanceEnquiry(): Observable<boolean> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    const requestBody = {
      header: {
        requestNo: 'REQ' + Date.now(),
        deviceInfo: {
          browser: 'Browser',
          browserVersion: navigator.userAgent,
        },
      },
      body: {},
    };

    return this.http
      .post<BalanceEnquiryApiResponse>(API_ENDPOINTS.DASHBOARD.BALANCE_ENQUIRY, requestBody)
      .pipe(
        tap((response) => {
          const data = response?.body?.balanceResponse;
          if (data) {
            this.accountsSignal.set(data.accounts ?? []);
            this.correlationIdSignal.set(data.correlationId ?? '');
            this.lastFetchedAtSignal.set(new Date());
          }
          this.isLoadingSignal.set(false);
        }),
        map(() => true),
        catchError((err) => {
          console.error('[BalanceEnquiryService] Error fetching balance:', err);
          this.errorSignal.set('Failed to fetch balance. Please try again.');
          this.isLoadingSignal.set(false);
          return of(false);
        }),
      );
  }

  /**
   * Format a raw numeric balance amount into a localized currency string.
   */
  formatBalance(amount: number, currency: string): string {
    try {
      const locale = currency === 'INR' ? 'en-IN' : 'en-US';
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `${currency} ${amount.toFixed(2)}`;
    }
  }

  /** Human-readable account type label */
  getAccountTypeLabel(accountType: string): string {
    const labelMap: Record<string, string> = {
      SAVINGS: 'Savings Account',
      CURRENT: 'Current Account',
      NRE_SAVINGS: 'NRE Savings Account',
      NRO_SAVINGS: 'NRO Savings Account',
      FIXED_DEPOSIT: 'Fixed Deposit',
      RECURRING: 'Recurring Deposit',
    };
    return labelMap[accountType?.toUpperCase()] ?? accountType;
  }
}
