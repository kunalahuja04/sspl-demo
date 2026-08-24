import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, tap, map, catchError, of } from 'rxjs';
import { API_ENDPOINTS } from '../core/config/api-endpoints';
import { ApiRequestBuilderService } from '../core/services/api-request-builder.service';
import { BankInfo, BankListRequest, BankListResponse } from '../models';

@Injectable({
  providedIn: 'root',
})
export class BankService {
  private http = inject(HttpClient);
  private requestBuilder = inject(ApiRequestBuilderService);

  private banksSignal = signal<BankInfo[]>([]);
  private selectedBankSignal = signal<BankInfo | null>(null);
  private isLoadingSignal = signal<boolean>(false);

  /** All available banks from bank list API */
  readonly banks = this.banksSignal.asReadonly();

  /** Currently selected bank by user */
  readonly selectedBank = this.selectedBankSignal.asReadonly();

  readonly isLoading = this.isLoadingSignal.asReadonly();

  constructor() {
    this.restoreFromStorage();
  }

  /**
   * Fetches the bank list from the API (/TestBedGateway/API/banking/bank/list).
   * Returns banks with their theme configuration.
   */
  fetchBankList(): Observable<BankInfo[]> {
    this.isLoadingSignal.set(true);

    const payload: BankListRequest = this.requestBuilder.buildRequest({});

    return this.http.post<BankListResponse>(API_ENDPOINTS.BANKING.BANK_LIST, payload).pipe(
      map((response) => {
        const rawBanks = response.body?.bankListResponse?.banks || [];
        return rawBanks.map((b) => ({
          ...b,
          bankId: b.bankId || b.bankCode || '',
          shortName: b.shortName || b.bankShortCode || '',
          bankCode: b.bankId || b.bankCode || '',
          bankShortCode: b.shortName || b.bankShortCode || '',
          theme: {
            ...b.theme,
            primaryColor: b.theme?.primaryColor || b.theme?.headerBgColor || '#082F49',
            secondaryColor: b.theme?.secondaryColor || b.theme?.menuBgColor || '#075985',
            footerText: b.theme?.footerText || b.theme?.footerBgColor || '#041F31',
            headerBgColor: b.theme?.primaryColor || b.theme?.headerBgColor || '#082F49',
            menuBgColor: b.theme?.secondaryColor || b.theme?.menuBgColor || '#075985',
            footerBgColor: b.theme?.footerText || b.theme?.footerBgColor || '#041F31',
          },
        }));
      }),
      tap((banks: BankInfo[]) => {
        this.banksSignal.set(banks);
        this.isLoadingSignal.set(false);

        // If no bank is selected yet, default to the first bank
        if (!this.selectedBankSignal() && banks.length > 0) {
          this.selectBank(banks[0]);
        }
      }),
      catchError((error) => {
        console.error('[BankService] Failed to fetch bank list:', error);
        this.isLoadingSignal.set(false);
        return of([]);
      }),
    );
  }

  /**
   * Fetches the list of banks associated with a customer's registered mobile number.
   */
  fetchCustomerBankList(mobileNumber: string): Observable<any[]> {
    const payload = this.requestBuilder.buildRequest({
      customerBankRequest: { mobileNumber },
    });

    return this.http
      .post<any>(API_ENDPOINTS.BANKING.CUSTOMER_BANK_LIST, payload)
      .pipe(
        map((response) => response.body?.customerBankListResponse?.banks || []),
        catchError((err) => {
          console.error('[BankService] Failed to fetch customer bank list:', err);
          return of([]);
        }),
      );
  }


  /**
   * Selects a bank, applies its theme, and persists to storage.
   */
  selectBank(bank: BankInfo): void {
    this.selectedBankSignal.set(bank);
    this.persistToStorage(bank);
  }

  /**
   * Selects a bank by tenantId (used when restoring state).
   */
  selectBankByTenantId(tenantId: string): void {
    const banks = this.banksSignal();
    const bank = banks.find((b) => b.tenantId === tenantId);
    if (bank) {
      this.selectBank(bank);
    }
  }

  private persistToStorage(bank: BankInfo): void {
    try {
      sessionStorage.setItem('sspl_selected_bank', JSON.stringify(bank));
    } catch {
      // Storage fallback
    }
  }

  private restoreFromStorage(): void {
    try {
      const stored = sessionStorage.getItem('sspl_selected_bank');
      if (stored) {
        const bank: BankInfo = JSON.parse(stored);
        this.selectedBankSignal.set(bank);
      }
    } catch {
      // Ignore parsing errors
    }
  }
}
