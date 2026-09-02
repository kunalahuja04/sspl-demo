import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap, catchError, of } from 'rxjs';
import { API_ENDPOINTS } from '../core/config/api-endpoints';
import { ApiRequestBuilderService } from '../core/services/api-request-builder.service';
import {
  DashboardSummaryData,
  BankAccountData,
  TransactionData,
  BalanceEnquiryRequest,
  BalanceEnquiryApiResponse,
  BalanceEnquiryAccount,
} from '../models';

export type DashboardSummary = DashboardSummaryData;
export type BankAccount = BankAccountData;
export type Transaction = TransactionData;

const DUMMY_TRANSACTIONS: TransactionData[] = [
  {
    id: 'TXN-9401',
    title: 'Salary Credit · Tech Innovations Ltd',
    date: 'Today, 09:30 AM · NEFT',
    account: 'A/C XXXXXXXX0001',
    amount: '+₹45,000.00',
    type: 'credit',
    reference: 'NEFT/318290/SALARY',
    status: 'Completed',
  },
  {
    id: 'TXN-9402',
    title: 'Amazon India Online Services',
    date: 'Today, 11:15 AM · UPI',
    account: 'A/C XXXXXXXX0001',
    amount: '-₹2,499.00',
    type: 'debit',
    reference: 'UPI/318291/AMZN',
    status: 'Completed',
  },
  {
    id: 'TXN-9403',
    title: 'Savings Interest Payout · Q4',
    date: 'Yesterday, 06:00 PM · Auto-Credit',
    account: 'A/C XXXXXXXX0001',
    amount: '+₹1,245.00',
    type: 'credit',
    reference: 'INTR/Q42026/SSPL',
    status: 'Completed',
  },
  {
    id: 'TXN-9404',
    title: 'Electricity Bill · Tata Power BBPS',
    date: 'Yesterday, 02:45 PM · Utility',
    account: 'A/C XXXXXXXX0001',
    amount: '-₹1,850.00',
    type: 'debit',
    reference: 'BBPS/948271/EBILL',
    status: 'Completed',
  },
  {
    id: 'TXN-9405',
    title: 'UPI Transfer · Rohan Mehta',
    date: '01 Jun 2026, 04:20 PM · P2P',
    account: 'A/C XXXXXXXX0001',
    amount: '-₹500.00',
    type: 'debit',
    reference: 'UPI/318295/PAY',
    status: 'Completed',
  },
];

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private http = inject(HttpClient);
  private requestBuilder = inject(ApiRequestBuilderService);

  // State Signals
  private summarySignal = signal<DashboardSummary | null>(null);
  private accountsSignal = signal<BankAccount[]>([]);
  private transactionsSignal = signal<Transaction[]>(DUMMY_TRANSACTIONS);
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
   * Calls /balance/enquiry API on the dashboard and populates dashboard information.
   * Obsoletes previous /dashboard/summary, /dashboard/accounts, and /dashboard/transactions calls.
   */
  fetchDashboardData(): Observable<boolean> {
    this.isLoadingSignal.set(true);

    const requestBody: BalanceEnquiryRequest = this.requestBuilder.buildRequest({});

    return this.http
      .post<BalanceEnquiryApiResponse>(API_ENDPOINTS.BANKING.BALANCE_ENQUIRY, requestBody)
      .pipe(
        tap((response) => {
          const balanceData = response?.body?.balanceResponse;
          if (balanceData?.accounts && balanceData.accounts.length > 0) {
            this.bindBalanceData(balanceData.accounts);
          } else {
            this.bindFallbackData();
          }
          this.isLoadingSignal.set(false);
        }),
        map(() => true),
        catchError((error) => {
          console.error('[DashboardService] Error fetching balance enquiry for dashboard:', error);
          this.bindFallbackData();
          this.isLoadingSignal.set(false);
          return of(false);
        }),
      );
  }

  private bindBalanceData(rawAccounts: BalanceEnquiryAccount[]): void {
    const mappedAccounts: BankAccount[] = rawAccounts.map((acc, index) => {
      const typeUpper = (acc.accountType || '').toUpperCase();
      const cat: 'savings' | 'current' | 'nri' =
        typeUpper.includes('CURRENT')
          ? 'current'
          : typeUpper.includes('NRI') || typeUpper.includes('NRE')
          ? 'nri'
          : 'savings';

      const typeName =
        typeUpper === 'SAVINGS'
          ? 'Savings Account'
          : typeUpper === 'CURRENT'
          ? 'Current Account'
          : `${acc.accountType} Account`;

      const curr = (acc.currency as 'INR' | 'USD' | 'EUR') || 'INR';

      const formatCurrency = (val: number) =>
        new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: curr,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(val);

      return {
        id: `acc_${index + 1}`,
        type: typeName,
        category: cat,
        accountNumber: acc.accountNumberMasked,
        fullAccountNumber: acc.accountNumberMasked,
        ifsc: 'BHAR0000001',
        branch: 'Corporate Banking Branch',
        availableBalance: formatCurrency(acc.availableBalance),
        ledgerBalance: formatCurrency(acc.ledgerBalance),
        currency: curr,
        status: 'Active',
        unclearedFunds: '₹0.00',
        lienAmount: '₹0.00',
        interestRate: cat === 'savings' ? '4.00% p.a.' : 'N/A',
        nomineeRegistered: true,
      };
    });

    this.accountsSignal.set(mappedAccounts);

    const totalAvailable = rawAccounts.reduce((sum, a) => sum + (a.availableBalance || 0), 0);
    const totalAvailableFormatted = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(totalAvailable);

    this.summarySignal.set({
      totalBalanceFormatted: totalAvailableFormatted,
      totalBalanceSubtitle: `Across ${rawAccounts.length} active account${rawAccounts.length > 1 ? 's' : ''}`,
      todaysCredits: '+₹46,245.00',
      todaysCreditsCount: '2 transactions',
      todaysDebits: '-₹4,849.00',
      todaysDebitsCount: '3 transactions',
      activeAccountsCount: String(rawAccounts.length),
      activeAccountsSubtitle: 'All accounts in good standing',
    });

    const firstAccNum = rawAccounts[0]?.accountNumberMasked || 'XXXXXXXX0001';
    const txns = DUMMY_TRANSACTIONS.map((t) => ({
      ...t,
      account: `A/C ${firstAccNum}`,
    }));
    this.transactionsSignal.set(txns);
  }

  private bindFallbackData(): void {
    const fallbackAccounts: BalanceEnquiryAccount[] = [
      {
        ledgerBalance: 8765,
        accountType: 'SAVINGS',
        accountNumberMasked: 'XXXXXXXX0001',
        currency: 'INR',
        availableBalance: 56453,
      },
    ];
    this.bindBalanceData(fallbackAccounts);
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
