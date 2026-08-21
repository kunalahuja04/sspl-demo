import { Injectable, signal, computed } from '@angular/core';
import { Observable, of, delay, tap } from 'rxjs';

export interface DashboardSummary {
  totalBalanceFormatted: string;
  totalBalanceSubtitle: string;
  todaysCredits: string;
  todaysCreditsCount: string;
  todaysDebits: string;
  todaysDebitsCount: string;
  activeAccountsCount: string;
  activeAccountsSubtitle: string;
}

export interface BankAccount {
  id: string;
  type: string;
  category: 'savings' | 'current' | 'nri';
  accountNumber: string;
  fullAccountNumber: string;
  ifsc: string;
  branch: string;
  availableBalance: string;
  ledgerBalance: string;
  currency: 'INR' | 'USD' | 'EUR';
  status: 'Active' | 'Dormant' | 'Frozen';
  unclearedFunds?: string;
  lienAmount?: string;
  interestRate?: string;
  nomineeRegistered?: boolean;
}

export interface Transaction {
  id: string;
  title: string;
  date: string;
  account: string;
  amount: string;
  type: 'credit' | 'debit';
  reference: string;
  status: 'Completed' | 'Pending';
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
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
    return list.filter(acc =>
      acc.type.toLowerCase().includes(query) ||
      acc.accountNumber.toLowerCase().includes(query) ||
      acc.branch.toLowerCase().includes(query) ||
      acc.ifsc.toLowerCase().includes(query) ||
      acc.currency.toLowerCase().includes(query)
    );
  });

  constructor() {
    this.fetchDashboardData();
  }

  /**
   * Fetches all dashboard data from mock API with realistic network delay
   */
  fetchDashboardData(): Observable<boolean> {
    this.isLoadingSignal.set(true);

    const mockSummary: DashboardSummary = {
      totalBalanceFormatted: '₹10.32L',
      totalBalanceSubtitle: 'Across all accounts',
      todaysCredits: '+₹1,37,000',
      todaysCreditsCount: '3 transactions',
      todaysDebits: '-₹16,390',
      todaysDebitsCount: '5 transactions',
      activeAccountsCount: '3',
      activeAccountsSubtitle: 'All accounts in good standing'
    };

    const mockAccounts: BankAccount[] = [
      {
        id: 'acc_01',
        type: 'Savings Account',
        category: 'savings',
        accountNumber: '•••• •••• 4521',
        fullAccountNumber: '50100483924521',
        ifsc: 'IFSC: SSPL0001042',
        branch: 'SSPL Navi Mumbai Main',
        availableBalance: '₹1,82,400.00',
        ledgerBalance: '₹1,82,400.00',
        currency: 'INR',
        status: 'Active',
        unclearedFunds: '₹0.00',
        lienAmount: '₹0.00',
        interestRate: '3.50% p.a.',
        nomineeRegistered: true
      },
      {
        id: 'acc_02',
        type: 'Current Account',
        category: 'current',
        accountNumber: '•••• •••• 8832',
        fullAccountNumber: '50200891028832',
        ifsc: 'IFSC: SSPL0000011',
        branch: 'SSPL Fort, Mumbai',
        availableBalance: '₹8,50,000.00',
        ledgerBalance: '₹8,52,000.00',
        currency: 'INR',
        status: 'Active',
        unclearedFunds: '₹2,000.00 (Cheque in clearing)',
        lienAmount: '₹0.00',
        interestRate: 'N/A (Current Account)',
        nomineeRegistered: true
      },
      {
        id: 'acc_03',
        type: 'Savings Account (NRI)',
        category: 'nri',
        accountNumber: '•••• •••• 7310',
        fullAccountNumber: '50300174827310',
        ifsc: 'IFSC: SSPL0009001',
        branch: 'SSPL Overseas Branch',
        availableBalance: '$45,200.50',
        ledgerBalance: '$45,200.50',
        currency: 'USD',
        status: 'Active',
        unclearedFunds: '$0.00',
        lienAmount: '$0.00',
        interestRate: '4.25% p.a. (NRE)',
        nomineeRegistered: true
      }
    ];

    const mockTransactions: Transaction[] = [
      {
        id: 'txn_01',
        title: 'NEFT Cr — HDFC Bank',
        date: '08 Jun · A/C •••• 4521',
        account: 'A/C •••• 4521',
        amount: '+₹45,000',
        type: 'credit',
        reference: 'NEFT26060893019',
        status: 'Completed'
      },
      {
        id: 'txn_02',
        title: 'UPI — Swiggy',
        date: '07 Jun · A/C •••• 4521',
        account: 'A/C •••• 4521',
        amount: '-₹850',
        type: 'debit',
        reference: 'UPI26060718392',
        status: 'Completed'
      },
      {
        id: 'txn_03',
        title: 'ATM Withdrawal',
        date: '05 Jun · A/C •••• 4521',
        account: 'A/C •••• 4521',
        amount: '-₹10,000',
        type: 'debit',
        reference: 'ATM26060599104',
        status: 'Completed'
      },
      {
        id: 'txn_04',
        title: 'Salary Credit',
        date: '02 Jun · A/C •••• 4521',
        account: 'A/C •••• 4521',
        amount: '+₹92,000',
        type: 'credit',
        reference: 'SAL26060284920',
        status: 'Completed'
      }
    ];

    return of(true).pipe(
      delay(300),
      tap(() => {
        this.summarySignal.set(mockSummary);
        this.accountsSignal.set(mockAccounts);
        this.transactionsSignal.set(mockTransactions);
        this.isLoadingSignal.set(false);
      })
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
    const acc = this.accountsSignal().find(a => a.id === accountId);
    return of(acc).pipe(delay(400));
  }
}
