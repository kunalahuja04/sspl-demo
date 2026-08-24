import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, tap, catchError, of } from 'rxjs';
import { API_ENDPOINTS } from '../core/config/api-endpoints';
import {
  DashboardSummaryData,
  BankAccountData,
  TransactionData,
  DashboardSummaryResponse,
  AccountsListResponse,
  TransactionsListResponse,
} from '../models';

export type DashboardSummary = DashboardSummaryData;
export type BankAccount = BankAccountData;
export type Transaction = TransactionData;

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private http = inject(HttpClient);

  // State Signals
  private summarySignal = signal<DashboardSummary | null>(null);
  private accountsSignal = signal<BankAccount[]>([]);
  private transactionsSignal = signal<Transaction[]>([]);
  private isLoadingSignal = signal<boolean>(false);
  private searchQuerySignal = signal<string>('');
  private selectedAccountSignal = signal<BankAccount | null>(null);

  // Readonly public signals
  readonly summary = this.summarySignal.asReadonly();
  readonly accounts = this.accountsSignal.asReadonly();
  readonly transactions = this.transactionsSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly searchQuery = this.searchQuerySignal.asReadonly();
  readonly selectedAccount = this.selectedAccountSignal.asReadonly();

  // Computed filtered accounts
  readonly filteredAccounts = computed(() => {
    const query = this.searchQuerySignal().toLowerCase().trim();
    const list = this.accountsSignal();
    if (!query) {
      return list;
    }
    return list.filter(
      (acc) =>
        acc.type.toLowerCase().includes(query) ||
        acc.accountNumber.toLowerCase().includes(query) ||
        acc.branch.toLowerCase().includes(query) ||
        acc.ifsc.toLowerCase().includes(query) ||
        acc.currency.toLowerCase().includes(query),
    );
  });

  constructor() {
    this.fetchDashboardData().subscribe();
  }

  /**
   * Fetches all dashboard data from API endpoints via HttpClient.
   * Intercepted by MockApiInterceptor in development/mock mode or routed to live API.
   */
  fetchDashboardData(): Observable<boolean> {
    this.isLoadingSignal.set(true);

    return forkJoin({
      summary: this.http.get<DashboardSummaryResponse>(API_ENDPOINTS.DASHBOARD.SUMMARY),
      accounts: this.http.get<AccountsListResponse>(API_ENDPOINTS.DASHBOARD.ACCOUNTS),
      transactions: this.http.get<TransactionsListResponse>(API_ENDPOINTS.DASHBOARD.TRANSACTIONS),
    }).pipe(
      tap(({ summary, accounts, transactions }) => {
        if (summary?.body) {
          this.summarySignal.set(summary.body);
        }
        if (accounts?.body) {
          this.accountsSignal.set(accounts.body);
        }
        if (transactions?.body) {
          this.transactionsSignal.set(transactions.body);
        }
        this.isLoadingSignal.set(false);
      }),
      map(() => true),
      catchError((error) => {
        console.error('[DashboardService] Error fetching dashboard data:', error);
        this.isLoadingSignal.set(false);
        return of(false);
      }),
    );
  }

  /**
   * Filter accounts by search keyword
   */
  setSearchQuery(query: string): void {
    this.searchQuerySignal.set(query);
  }

  /**
   * Select an account for balance enquiry details modal
   */
  selectAccountForEnquiry(account: BankAccount | null): void {
    this.selectedAccountSignal.set(account);
  }

  /**
   * Refreshes account balance from core banking API
   */
  refreshAccount(accountId: string): Observable<BankAccount | undefined> {
    const acc = this.accountsSignal().find((a) => a.id === accountId);
    return of(acc);
  }
}
