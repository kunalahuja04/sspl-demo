/**
 * Loan Microservice — API Models
 * Matches all 10 Banking Loan API request/response schemas exactly.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Shared / reusable enumerations
// ─────────────────────────────────────────────────────────────────────────────

export type LoanProductCode = 'PERSONAL_LOAN' | 'HOME_LOAN' | 'VEHICLE_LOAN' | 'BUSINESS_LOAN';

/** Sections of the loan application journey, as returned by the backend. */
export type LoanJourneySection = 'PERSONAL_DETAILS' | 'LOAN_REQUIREMENT' | 'REVIEW' | 'SUBMITTED';

/** Possible application lifecycle statuses. */
export type LoanApplicationStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';

// ─────────────────────────────────────────────────────────────────────────────
// 1. GET /banking/loan/product/list
// ─────────────────────────────────────────────────────────────────────────────

/** A single product entry from the loan product list. */
export interface LoanProduct {
  productCode: LoanProductCode;
  productName: string;
  productDescription: string;
  lobCode: string;
  minimumAmount: number;
  maximumAmount: number;
  indicativeInterestRate: number;
  minimumTenureMonths: number;
  maximumTenureMonths: number;
}

/** Request body — no body fields required; send `{}`. */
export interface LoanProductListRequest {}

/** Response body for `banking/loan/product/list`. */
export interface LoanProductListResponseBody {
  loanProductListResponse: {
    products: LoanProduct[];
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. POST /banking/loan/journey
// ─────────────────────────────────────────────────────────────────────────────

/** Request body for `banking/loan/journey`. */
export interface LoanJourneyRequest {
  loanJourneyRequest: {
    productCode: LoanProductCode;
  };
}

/** Journey state returned by the API. */
export interface LoanJourneyState {
  requestedProductCode: LoanProductCode;
  productMismatch: boolean;
  applicationAlreadyExists: boolean;
  currentSection: LoanJourneySection;
  applicationReference: string | null;
  applicationProductCode: LoanProductCode | null;
  applicationProductName: string | null;
  applicationStatus: LoanApplicationStatus | null;
  lastCompletedSection: LoanJourneySection | null;
  lastUpdatedChannel: string | null;
  sourceChannel: string | null;
  updatedAt: number | null;
}

/** Response body for `banking/loan/journey`. */
export interface LoanJourneyResponseBody {
  loanJourneyResponse: LoanJourneyState;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. POST /banking/save/loan/personaldetails
// ─────────────────────────────────────────────────────────────────────────────

/** Personal details payload for the first application section. */
export interface LoanPersonalDetailsSaveRequest {
  loanPersonalDetailsSaveRequest: {
    applicationReference: string | null;
    productCode: LoanProductCode;
    fullName: string;
    mobileNumber: string;
    fatherName: string;
    emailId: string;
    addressLine: string;
    postalCode: string;
    dateOfBirth: string; // ISO date: "YYYY-MM-DD"
  };
}

/** Common save-section response returned after saving any section. */
export interface LoanSectionSaveState {
  savedSection: LoanJourneySection;
  nextSection: LoanJourneySection;
  applicationReference: string;
  applicationStatus: LoanApplicationStatus;
  lastUpdatedChannel: string;
  sourceChannel: string;
  updatedAt: number;
}

/** Response body for `banking/save/loan/personaldetails`. */
export interface LoanPersonalDetailsSaveResponseBody {
  loanSectionSaveResponse: LoanSectionSaveState;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. POST /banking/calculate/loan/quote
// ─────────────────────────────────────────────────────────────────────────────

/** Request body for loan quote calculation. */
export interface LoanQuoteRequest {
  loanQuoteRequest: {
    applicationReference: string;
    productCode: LoanProductCode;
    requestedAmount: number;
    requestedTenureMonths: number;
  };
}

/** Calculated quote returned by the API. */
export interface LoanQuoteCalculation {
  quoteReference: string;
  productCode: LoanProductCode;
  productName: string;
  requestedAmount: number;
  finalFacilityAmount: number;
  processingFee: number;
  indicativeInterestRate: number;
  requestedTenureMonths: number;
  estimatedEmi: number;
  quoteValidUntil: number; // epoch ms
}

/** Response body for `banking/calculate/loan/quote`. */
export interface LoanQuoteResponseBody {
  loanQuoteCalculationResponse: LoanQuoteCalculation;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. POST /banking/save/loan/requirement
// ─────────────────────────────────────────────────────────────────────────────

/** Request body for saving loan requirement section. */
export interface LoanRequirementSaveRequest {
  loanRequirementSaveRequest: {
    applicationReference: string;
    quoteReference: string;
    productCode: LoanProductCode;
    requestedAmount: number;
    requestedTenureMonths: number;
    loanPurpose: string;
  };
}

/** Response body for `banking/save/loan/requirement`. */
export interface LoanRequirementSaveResponseBody {
  loanSectionSaveResponse: LoanSectionSaveState;
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. POST /banking/get/loan/application
// ─────────────────────────────────────────────────────────────────────────────

/** Request body for fetching a specific loan application. */
export interface GetLoanApplicationRequest {
  loanApplicationRequest: {
    applicationReference: string;
  };
}

/** Embedded quote data inside the full loan application. */
export interface LoanApplicationQuote {
  quoteReference: string;
  indicativeInterestRate: number;
  finalFacilityAmount: number;
  processingFee: number;
  estimatedEmi: number;
  quoteValidUntil: number;
}

/** Embedded personal details inside the full loan application. */
export interface LoanApplicationPersonalDetails {
  fullName: string;
  fatherName: string;
  mobileNumber: string;
  emailId: string;
  dateOfBirth: string;
  addressLine: string;
  postalCode: string;
}

/** Embedded loan requirement inside the full loan application. */
export interface LoanApplicationRequirement {
  productCode: LoanProductCode;
  requestedAmount: number;
  requestedTenureMonths: number;
  loanPurpose: string;
}

/** Full loan application detail as returned by the API. */
export interface LoanApplicationDetail {
  applicationReference: string;
  applicationStatus: LoanApplicationStatus;
  currentSection: LoanJourneySection;
  lastCompletedSection: LoanJourneySection;
  lastUpdatedChannel: string;
  sourceChannel: string;
  personalDetails: LoanApplicationPersonalDetails;
  loanRequirement: LoanApplicationRequirement;
  loanQuote: LoanApplicationQuote;
  createdAt: number;
  updatedAt: number;
}

/** Response body for `banking/get/loan/application`. */
export interface GetLoanApplicationResponseBody {
  loanApplicationResponse: LoanApplicationDetail;
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. POST /banking/list/eligible/credit/accounts
// ─────────────────────────────────────────────────────────────────────────────

/** Request body — no body fields required; send `{}`. */
export interface EligibleCreditAccountsRequest {}

/** A single eligible credit account. */
export interface EligibleCreditAccount {
  accountReference: string;
  accountType: 'SAVINGS' | 'CURRENT' | 'OD';
  currency: string;
  maskedAccountNumber: string;
}

/** Response body for `banking/list/eligible/credit/accounts`. */
export interface EligibleCreditAccountsResponseBody {
  eligibleCreditAccountListResponse: {
    accounts: EligibleCreditAccount[];
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. POST /banking/submit/loan/application
// ─────────────────────────────────────────────────────────────────────────────

/** Request body for final loan application submission. */
export interface SubmitLoanApplicationRequest {
  loanApplicationSubmitRequest: {
    applicationReference: string;
    creditAccountReference: string;
    communicationEmail: string;
    termsAccepted: boolean;
    termsVersion: string;
  };
}

/** Response after successful loan application submission. */
export interface LoanApplicationSubmitState {
  applicationReference: string;
  applicationStatus: LoanApplicationStatus;
  submittedChannel: string;
  sourceChannel: string;
  maskedCreditAccount: string;
  creditAccountReference: string;
  submittedAt: number;
}

/** Response body for `banking/submit/loan/application`. */
export interface SubmitLoanApplicationResponseBody {
  loanApplicationSubmitResponse: LoanApplicationSubmitState;
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. POST /banking/get/loan/application/status
// ─────────────────────────────────────────────────────────────────────────────
// Reuses GetLoanApplicationRequest for the request body.

/** Status summary for a loan application. */
export interface LoanApplicationStatusDetail {
  applicationReference: string;
  productCode: LoanProductCode;
  productName: string;
  requestedAmount: number;
  requestedTenureMonths: number;
  finalFacilityAmount: number;
  indicativeInterestRate: number;
  estimatedEmi: number;
  applicationStatus: LoanApplicationStatus;
  statusDisplayName: string;
  creditAccountReference: string;
  maskedCreditAccount: string;
  lastUpdatedChannel: string;
  sourceChannel: string;
  createdAt: number;
  submittedAt: number;
  updatedAt: number;
}

/** Response body for `banking/get/loan/application/status`. */
export interface GetLoanApplicationStatusResponseBody {
  loanApplicationStatusResponse: LoanApplicationStatusDetail;
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. POST /banking/list/loan/applications
// ─────────────────────────────────────────────────────────────────────────────

/** Request body — no body fields required; send `{}`. */
export interface ListLoanApplicationsRequest {}

/** Summary item in the loan applications list. */
export interface LoanApplicationSummary {
  applicationReference: string;
  productCode: LoanProductCode;
  productName: string;
  requestedAmount: number;
  requestedTenureMonths: number;
  estimatedEmi: number;
  applicationStatus: LoanApplicationStatus;
  statusDisplayName: string;
  currentSection: LoanJourneySection | 'SUBMITTED';
  maskedCreditAccount: string;
  lastUpdatedChannel: string;
  sourceChannel: string;
  createdAt: number;
  submittedAt: number;
  updatedAt: number;
}

/** Response body for `banking/list/loan/applications`. */
export interface ListLoanApplicationsResponseBody {
  loanApplicationListResponse: {
    applications: LoanApplicationSummary[];
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// UI-Only / Computed Models (not from API — used purely in frontend views)
// ─────────────────────────────────────────────────────────────────────────────

/** Frontend product type alias derived from productCode for display logic. */
export type LoanType = 'home' | 'personal' | 'car' | 'education' | 'business' | 'gold';

/** Extended category supporting custom loan enquiry flow (non-API types). */
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

/** View model for a pre-approved loan offer card — enriched from `LoanProduct`. */
export interface PreApprovedLoanOffer {
  id: string;
  type: LoanType;
  productCode: LoanProductCode;
  title: string;
  tagline: string;
  iconName: string;
  badgeText: string;
  badgeColor?: 'accent' | 'success' | 'warning' | 'info';
  maxAmount: number;
  minAmount: number;
  defaultAmount: number;
  interestRate: number;
  minTenureMonths: number;
  maxTenureMonths: number;
  defaultTenureMonths: number;
  tenureOptions: number[];
  processingFee: string;
  disbursalSpeed: string;
  creditScoreRequired: number;
  bankingHealthScore: number;
  relationshipTier: string;
  eligibilityReason: string;
  features: string[];
  amortizationHighlights: string[];
}

/** Tracks an active ongoing loan in the UI (sourced from list/status APIs). */
export interface ActiveLoanItem {
  id: string;
  accountNumber: string;
  loanType: LoanType;
  title: string;
  sanctionedAmount: number;
  remainingPrincipal: number;
  paidPrincipal: number;
  currentAdjustedRoi: number;
  benchmarkDetails: string;
  monthlyEmi: number;
  nextEmiDate: string;
  nextEmiAmount: number;
  tenureMonths: number;
  emisPaid: number;
  emisRemaining: number;
  disbursalDate: string;
  disbursalAccount: string;
  status: 'ACTIVE' | 'CLOSED' | 'OVERDUE';
  progressPercentage: number;
}

/** UI banking health metrics for the pre-approval context panel. */
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

/** Result of an EMI calculation (purely local, no API call). */
export interface LoanCalculationResult {
  monthlyEmi: number;
  principalAmount: number;
  totalInterest: number;
  totalPayable: number;
  interestPercentage: number;
  principalPercentage: number;
}

/**
 * Payload assembled by the UI wizard before calling the real Loan MS APIs.
 * Maps onto: savePersonalDetails → calculateQuote → saveRequirement → submitApplication.
 */
export interface LoanApplicationPayload {
  productCode: LoanProductCode;
  /** Used for `loanPersonalDetailsSaveRequest.applicationReference` (null on first call). */
  applicationReference: string | null;
  /** Personal details section fields. */
  fullName: string;
  mobileNumber: string;
  fatherName: string;
  emailId: string;
  addressLine: string;
  postalCode: string;
  dateOfBirth: string;
  /** Loan requirement section fields. */
  requestedAmount: number;
  requestedTenureMonths: number;
  loanPurpose: string;
  /** Submission fields. */
  creditAccountReference: string;
  communicationEmail: string;
  termsAccepted: boolean;
  termsVersion: string;
}

/**
 * UI-facing sanction/submission result (assembled from SubmitLoanApplicationResponseBody
 * plus the calculated quote for display on the success screen).
 */
export interface LoanSanctionResponse {
  applicationReference: string;
  applicationStatus: LoanApplicationStatus;
  submittedChannel: string;
  maskedCreditAccount: string;
  creditAccountReference: string;
  submittedAt: number;
  /** Quote details carried forward for the success screen. */
  finalFacilityAmount: number;
  indicativeInterestRate: number;
  estimatedEmi: number;
  processingFee: number;
  quoteReference: string;
  productName: string;
  requestedTenureMonths: number;
}

/** Payload for the custom (non-pre-approved) loan enquiry flow. */
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

/** Response model for the local custom loan enquiry submission. */
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
