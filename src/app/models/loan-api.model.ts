/**
 * Banking Loan Models and Offer Definitions
 */

export type LoanType = 'home' | 'personal' | 'car' | 'education' | 'business' | 'gold';

export interface PreApprovedLoanOffer {
  id: string;
  type: LoanType;
  title: string;
  tagline: string;
  iconName: string;
  badgeText: string;
  badgeColor?: 'accent' | 'success' | 'warning' | 'info';
  maxAmount: number;
  minAmount: number;
  defaultAmount: number;
  interestRate: number; // e.g. 8.40 for 8.40% p.a.
  minTenureMonths: number;
  maxTenureMonths: number;
  defaultTenureMonths: number;
  tenureOptions: number[]; // e.g. [12, 24, 36, 48, 60, 120, 240]
  processingFee: string;
  disbursalSpeed: string;
  creditScoreRequired: number;
  bankingHealthScore: number;
  relationshipTier: string;
  eligibilityReason: string;
  features: string[];
  amortizationHighlights: string[];
}

export interface UserBankingHealthMetrics {
  cibilScore: number;
  cibilMax: number;
  scoreCategory: 'Excellent' | 'Good' | 'Fair';
  scorePercentile: string;
  relationshipTier: string;
  relationshipDuration: string;
  accountHealthScore: number;
  cleanEmiHistory: string;
  bouncesCount: number;
  preApprovedTotalLimit: number;
  preApprovedOffersCount: number;
  linkedSalaryAccount: string;
}

export interface LoanCalculationResult {
  monthlyEmi: number;
  principalAmount: number;
  totalInterest: number;
  totalPayable: number;
  interestPercentage: number;
  principalPercentage: number;
}

export interface LoanApplicationPayload {
  loanId: string;
  loanType: LoanType;
  appliedAmount: number;
  tenureMonths: number;
  monthlyEmi: number;
  interestRate: number;
  disbursalAccount: string;
  customerId: string;
  otpCode?: string;
  agreeKfs?: boolean;
  agreeNach?: boolean;
  agreeCreditBureau?: boolean;
  documentsVerified?: boolean;
}

export interface LoanSanctionResponse {
  applicationId: string;
  sanctionNumber: string;
  status: 'APPROVED' | 'PENDING' | 'UNDER_REVIEW' | 'REJECTED';
  loanType: LoanType;
  loanTitle: string;
  sanctionedAmount: number;
  tenureMonths: number;
  interestRate: number;
  monthlyEmi: number;
  disbursalAccount: string;
  sanctionDate: string;
  expiryDate: string;
  referenceCode: string;
  submittedAt?: string;
  estimatedReviewTime?: string;
  trackingStages?: Array<{
    title: string;
    description: string;
    status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING';
    timestamp?: string;
  }>;
}

