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

export interface ActiveLoanItem {
  id: string;
  accountNumber: string;
  loanType: LoanType;
  title: string;
  sanctionedAmount: number;
  remainingPrincipal: number;
  paidPrincipal: number;
  currentAdjustedRoi: number; // e.g. 9.85 for 9.85% p.a.
  benchmarkDetails: string; // e.g. 'EBLR 6.50% + 3.35% (Repo rate adjusted)'
  monthlyEmi: number;
  nextEmiDate: string; // e.g. '08 Sep 2026'
  nextEmiAmount: number;
  tenureMonths: number;
  emisPaid: number;
  emisRemaining: number;
  disbursalDate: string;
  disbursalAccount: string;
  status: 'ACTIVE' | 'CLOSED' | 'OVERDUE';
  progressPercentage: number;
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

export type ExtendedLoanCategory =
  | 'home'
  | 'personal'
  | 'car'
  | 'education'
  | 'business'
  | 'gold'
  | 'lap'
  | 'commercial_vehicle'
  | 'agriculture';

export interface CustomLoanEnquiryPayload {
  loanCategory: ExtendedLoanCategory;
  customLoanTitle: string;
  requiredAmount: number;
  tenureYears: number;
  tenureMonths: number;
  loanPurpose: string;
  employmentType:
    | 'SALARIED'
    | 'SELF_EMPLOYED_PROFESSIONAL'
    | 'SELF_EMPLOYED_BUSINESS'
    | 'NRI'
    | 'AGRICULTURIST';
  monthlyIncome: number;
  existingMonthlyEmi: number;
  preferredBankCode: string;
  preferredBranch?: string;
  applicantName: string;
  applicantMobile: string;
  applicantEmail: string;
  specialRemarks?: string;
}

export interface LoanEnquiryResponse {
  ticketNumber: string;
  status: 'SUBMITTED' | 'IN_REVIEW' | 'CONTACTED';
  loanCategory: ExtendedLoanCategory;
  loanTitle: string;
  requestedAmount: number;
  tenureMonths: number;
  indicativeRoi: number;
  indicativeMonthlyEmi: number;
  assignedOfficer: {
    name: string;
    designation: string;
    contactNumber: string;
    branchName: string;
  };
  submittedAt: string;
  expectedCallbackTime: string;
}
