import { ApiRequest, ApiResponse } from './api-envelope.model';

export interface DashboardSummaryData {
  totalBalanceFormatted: string;
  totalBalanceSubtitle: string;
  todaysCredits: string;
  todaysCreditsCount: string;
  todaysDebits: string;
  todaysDebitsCount: string;
  activeAccountsCount: string;
  activeAccountsSubtitle: string;
}

export interface BankAccountData {
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

export interface TransactionData {
  id: string;
  title: string;
  date: string;
  account: string;
  amount: string;
  type: 'credit' | 'debit';
  reference: string;
  status: 'Completed' | 'Pending';
}

export type DashboardSummaryResponse = ApiResponse<DashboardSummaryData>;
export type AccountsListResponse = ApiResponse<BankAccountData[]>;
export type TransactionsListResponse = ApiResponse<TransactionData[]>;
export type AccountDetailResponse = ApiResponse<BankAccountData>;

// ------- Balance Enquiry Models -------

/** Single account entry returned in the balanceResponse payload */
export interface BalanceEnquiryAccount {
  /** Raw ledger balance as a number (e.g. 77975) */
  ledgerBalance: number;
  /** Account category string (e.g. 'CURRENT', 'SAVINGS', 'NRE_SAVINGS') */
  accountType: string;
  /** Masked account number shown to the customer (e.g. 'XXXXXXXX0003') */
  accountNumberMasked: string;
  /** ISO 4217 currency code */
  currency: string;
  /** Raw available balance as a number */
  availableBalance: number;
}

export interface BalanceEnquiryData {
  correlationId: string;
  accounts: BalanceEnquiryAccount[];
  transactionId?: string;
}

export interface BalanceEnquiryResponseBody {
  balanceResponse: BalanceEnquiryData;
}

export type BalanceEnquiryRequest = ApiRequest<Record<string, unknown>>;
export type BalanceEnquiryApiResponse = ApiResponse<BalanceEnquiryResponseBody>;


