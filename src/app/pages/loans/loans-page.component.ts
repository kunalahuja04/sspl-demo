import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil, switchMap } from 'rxjs/operators';
import { SideNavComponent } from '../../components/side-nav/side-nav.component';
import { DashboardHeaderComponent } from '../dashboard/components/dashboard-header/dashboard-header.component';
import { LoanService } from '../../services/loan.service';
import { BankService } from '../../services/bank.service';
import { AuthService } from '../../services/auth.service';
import { ProfileService } from '../../services/profile.service';
import {
  LoanType,
  ExtendedLoanCategory,
  PreApprovedLoanOffer,
  LoanCalculationResult,
  LoanApplicationPayload,
  LoanSanctionResponse,
  CustomLoanEnquiryPayload,
  LoanEnquiryResponse,
  LoanProductCode,
  LoanApplicationSummary,
  LoanJourneyState,
  LoanQuoteCalculation,
} from '../../models';

export type PreApprovedStep =
  | 'overview'
  | 'customise'
  | 'verify_docs'
  | 'terms'
  | 'confirm'
  | 'success';
export type CustomEnquiryStep = 'configure' | 'applicant' | 'success';

export interface VerifiedDocument {
  title: string;
  subtitle: string;
  status: string;
  icon: string;
}

export interface CustomCategoryInfo {
  id: ExtendedLoanCategory;
  name: string;
  rate: number;
  icon: string;
  defaultAmount: number;
  minAmount: number;
  maxAmount: number;
  defaultTenureYears: number;
  maxTenureYears: number;
  tenureYearsList: number[];
}

@Component({
  selector: 'sspl-loans-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SideNavComponent, DashboardHeaderComponent],
  templateUrl: './loans-page.component.html',
  styleUrl: './loans-page.component.scss',
})
export class LoansPageComponent implements OnInit, OnDestroy {
  private loanService = inject(LoanService);
  private bankService = inject(BankService);
  private authService = inject(AuthService);
  private profileService = inject(ProfileService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // Active navigation ID for side navbar
  readonly activeNavId = signal<string>('loans');

  // Selected Bank & User Profile
  readonly selectedBank = this.bankService.selectedBank;
  readonly currentUser = this.authService.currentUser;
  readonly customerProfile = this.profileService.profile;
  readonly bankingMetrics = this.loanService.bankingHealthMetrics;
  readonly activeLoans = this.loanService.activeLoans;
  // Draft applications from list/loan/applications
  readonly draftApplications = this.loanService.draftApplications;
  // Loading states
  readonly isPageLoading = this.loanService.isPageLoading;
  readonly isQuoteLoading = this.loanService.isQuoteLoading;
  // Live quote from calculate/loan/quote API
  readonly liveQuote = this.loanService.liveQuote;

  // View Mode: 'pre_approved' (Default pre-approved catalog) | 'custom_enquiry' (New / Different loan requirement)
  readonly activeViewMode = signal<'pre_approved' | 'custom_enquiry'>('pre_approved');

  // ── Draft Resume Dialog State ────────────────────────────────────
  /** Whether to show the "Continue where you left off" modal. */
  readonly showDraftDialog = signal<boolean>(false);
  /** The draft being offered to resume. */
  readonly activeDraft = signal<LoanApplicationSummary | null>(null);
  /** Journey state returned by initLoanJourney (carries applicationAlreadyExists). */
  readonly journeyState = signal<LoanJourneyState | null>(null);
  /** Suppress the dialog for the current page session after user dismisses. */
  private draftDialogDismissed = false;

  // ── RxJS cleanup ─────────────────────────────────────────────────
  private readonly destroy$ = new Subject<void>();
  /** Debounce subject wiring slider/tenure changes to the quote API. */
  private readonly quoteParams$ = new Subject<{ amount: number; tenure: number | null }>();

  // ── Pre-Approved Flow State ─────────────────────────────────────
  readonly preApprovedStep = signal<PreApprovedStep>('overview');
  readonly allOffers = this.loanService.offers;
  readonly selectedOffer = signal<PreApprovedLoanOffer>(
    this.loanService.offers()[1] || this.loanService.offers()[0],
  );

  // Sliders & Customization
  readonly appliedAmount = signal<number>(300000);
  readonly tenureMonths = signal<number | null>(null);
  readonly tenureValidationError = signal<boolean>(false);
  readonly termsAgreed = signal<boolean>(false);
  readonly isDisbursing = signal<boolean>(false);
  readonly sanctionResponse = signal<LoanSanctionResponse | null>(null);

  // Pre-approved Verified Documents List
  readonly verifiedDocs: VerifiedDocument[] = [
    { title: 'Identity Proof', subtitle: 'Aadhaar •••• 3821', status: 'Verified', icon: 'id' },
    { title: 'Address Proof', subtitle: 'Aadhaar (same)', status: 'Verified', icon: 'home' },
    {
      title: 'Income Proof',
      subtitle: 'Salary Credits (Last 6M)',
      status: 'Verified',
      icon: 'income',
    },
    {
      title: 'Bank Statement',
      subtitle: 'SSPL SB A/C •••• 4521',
      status: 'Verified',
      icon: 'bank',
    },
    { title: 'PAN Card', subtitle: 'ABCDE1234F', status: 'Verified', icon: 'card' },
  ];

  // Dynamic Customer Profile Detail Getters
  readonly customerName = computed(() => {
    const profile = this.profileService.profile();
    if (profile?.firstName) return profile.firstName;
    if (profile?.fullName) return profile.fullName.split(' ')[0];
    const user = this.authService.currentUser();
    if (user?.name) return user.name.split(' ')[0];
    return 'Rajesh';
  });

  readonly customerFullName = computed(() => {
    const profile = this.profileService.profile();
    if (profile?.fullName) return profile.fullName;
    if (profile?.firstName && profile?.lastName) return `${profile.firstName} ${profile.lastName}`;
    const user = this.authService.currentUser();
    if (user?.name) return user.name;
    return 'Rajesh K. Sharma';
  });

  readonly customerMobile = computed(() => {
    const profile = this.profileService.profile();
    if (profile?.mobileNumber) {
      return profile.mobileNumber.startsWith('+91')
        ? profile.mobileNumber
        : `+91 ${profile.mobileNumber}`;
    }
    return '+91 88840 45346';
  });

  readonly customerEmail = computed(() => {
    const profile = this.profileService.profile();
    if (profile?.username) {
      return `${profile.username.toLowerCase()}@ssplbank.internal`;
    }
    return 'rajesh.sharma@ssplbank.internal';
  });

  // Reactive Calculation for Pre-Approved Loan
  // Falls back to local calculation when liveQuote is not yet available.
  readonly emiCalculation = computed<LoanCalculationResult>(() => {
    const q = this.liveQuote();
    if (q && q.requestedTenureMonths > 0) {
      const total = Math.round(q.estimatedEmi * q.requestedTenureMonths);
      const interest = Math.max(0, total - q.requestedAmount);
      const principalPct = Math.round((q.requestedAmount / total) * 100);
      return {
        monthlyEmi: Math.round(q.estimatedEmi),
        principalAmount: q.requestedAmount,
        totalInterest: interest,
        totalPayable: total,
        interestPercentage: 100 - principalPct,
        principalPercentage: principalPct,
      };
    }
    const offer = this.selectedOffer();
    const principal = this.appliedAmount();
    const tenure = this.tenureMonths();
    if (!tenure || tenure <= 0) {
      return {
        monthlyEmi: 0,
        principalAmount: principal,
        totalInterest: 0,
        totalPayable: principal,
        interestPercentage: 0,
        principalPercentage: 100,
      };
    }
    const roi = offer ? offer.interestRate : 10.5;
    return this.loanService.calculateEmi(principal, roi, tenure);
  });

  // Effective interest rate — from live quote if available, else from selected offer
  readonly effectiveRate = computed(() => {
    const q = this.liveQuote();
    if (q && q.indicativeInterestRate > 0) return q.indicativeInterestRate;
    return this.selectedOffer()?.interestRate ?? 10.5;
  });

  // Processing fee — from live quote or static offer default
  readonly processingFeeDisplay = computed(() => {
    const q = this.liveQuote();
    if (q) return q.processingFee === 0 ? '₹0.00 (Waived)' : this.formatInr(q.processingFee);
    return this.selectedOffer()?.processingFee ?? '₹0.00 (Waived)';
  });

  // Final facility amount from live quote
  readonly finalFacilityAmount = computed(() => {
    const q = this.liveQuote();
    return q ? q.finalFacilityAmount : this.appliedAmount();
  });

  // Dynamically generated tenure chips for the currently selected offer
  readonly tenureChips = computed<number[]>(() => {
    const offer = this.selectedOffer();
    if (!offer) return [12, 24, 36, 48, 60];
    if (offer.tenureOptions && offer.tenureOptions.length > 0) {
      return offer.tenureOptions;
    }
    return this.loanService.buildTenureOptions(
      offer.minTenureMonths || 6,
      offer.maxTenureMonths || 60,
      offer.productCode,
    );
  });

  // Dynamic quick-select amount presets based on product min & max limits
  readonly amountPresets = computed<number[]>(() => {
    const offer = this.selectedOffer();
    if (!offer) return [100000, 200000, 300000, 500000];
    const min = offer.minAmount;
    const max = offer.maxAmount;
    if (offer.productCode === 'HOME_LOAN') {
      return [1000000, 2500000, 5000000, 10000000].filter((a) => a >= min && a <= max);
    }
    if (offer.productCode === 'BUSINESS_LOAN') {
      return [500000, 1000000, 2500000, 5000000].filter((a) => a >= min && a <= max);
    }
    if (offer.productCode === 'VEHICLE_LOAN') {
      return [300000, 500000, 1000000, 2000000].filter((a) => a >= min && a <= max);
    }
    const candidates = [50000, 100000, 200000, 300000, 500000, 1000000];
    return candidates.filter((a) => a >= min && a <= max).slice(0, 4);
  });

  // ── Custom Enquiry State ─────────────────────────────────────────
  readonly customStep = signal<CustomEnquiryStep>('configure');

  readonly customCategories: CustomCategoryInfo[] = [
    {
      id: 'personal',
      name: 'Personal Loan',
      rate: 10.5,
      icon: 'user',
      defaultAmount: 300000,
      minAmount: 50000,
      maxAmount: 2500000,
      defaultTenureYears: 3,
      maxTenureYears: 5,
      tenureYearsList: [1, 2, 3, 4, 5],
    },
    {
      id: 'home',
      name: 'Home Loan',
      rate: 8.4,
      icon: 'home',
      defaultAmount: 4500000,
      minAmount: 500000,
      maxAmount: 15000000,
      defaultTenureYears: 20,
      maxTenureYears: 30,
      tenureYearsList: [5, 10, 15, 20, 25, 30],
    },
    {
      id: 'car',
      name: 'Car / Auto Loan',
      rate: 8.75,
      icon: 'car',
      defaultAmount: 1200000,
      minAmount: 100000,
      maxAmount: 5000000,
      defaultTenureYears: 5,
      maxTenureYears: 7,
      tenureYearsList: [1, 3, 5, 7],
    },
    {
      id: 'business',
      name: 'Business / MSME',
      rate: 11.25,
      icon: 'briefcase',
      defaultAmount: 2500000,
      minAmount: 200000,
      maxAmount: 10000000,
      defaultTenureYears: 4,
      maxTenureYears: 8,
      tenureYearsList: [1, 2, 3, 4, 5, 7],
    },
    {
      id: 'lap',
      name: 'Property Mortgage (LAP)',
      rate: 9.2,
      icon: 'building',
      defaultAmount: 5000000,
      minAmount: 500000,
      maxAmount: 20000000,
      defaultTenureYears: 10,
      maxTenureYears: 15,
      tenureYearsList: [3, 5, 10, 15],
    },
    {
      id: 'education',
      name: 'Education Loan',
      rate: 8.95,
      icon: 'education',
      defaultAmount: 2000000,
      minAmount: 100000,
      maxAmount: 7500000,
      defaultTenureYears: 7,
      maxTenureYears: 10,
      tenureYearsList: [3, 5, 7, 10],
    },
    {
      id: 'gold',
      name: 'Gold Loan',
      rate: 7.9,
      icon: 'gold',
      defaultAmount: 500000,
      minAmount: 25000,
      maxAmount: 2500000,
      defaultTenureYears: 1,
      maxTenureYears: 3,
      tenureYearsList: [1, 2, 3],
    },
  ];

  readonly selectedCustomCategory = signal<CustomCategoryInfo>(this.customCategories[0]);
  readonly customAmount = signal<number>(300000);
  readonly customTenureYears = signal<number>(3);
  readonly customEmploymentType = signal<
    'SALARIED' | 'SELF_EMPLOYED_PROFESSIONAL' | 'SELF_EMPLOYED_BUSINESS' | 'NRI' | 'AGRICULTURIST'
  >('SALARIED');
  readonly customMonthlyIncome = signal<number>(85000);
  readonly customExistingEmi = signal<number>(10000);
  readonly isSubmittingCustom = signal<boolean>(false);
  readonly customEnquiryResult = signal<LoanEnquiryResponse | null>(null);

  // Toast Notification
  readonly toastMessage = signal<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);

  // Computed EMI for Custom Loan Enquiry
  readonly customEmiCalculation = computed<LoanCalculationResult>(() => {
    const cat = this.selectedCustomCategory();
    const principal = this.customAmount();
    const tenureMonths = this.customTenureYears() * 12;
    return this.loanService.calculateEmi(principal, cat.rate, tenureMonths);
  });

  ngOnInit(): void {
    // Always reset to loading state on entry — service is singleton so isPageLoading
    // stays false after first visit without this reset.
    this.loanService.isPageLoading.set(true);
    this.draftDialogDismissed = false;

    if (!this.profileService.profile()) {
      this.profileService.fetchProfile().subscribe();
    }

    // Fetch real loan products from API (refreshes offers catalog)
    this.loanService.fetchLoanProducts().subscribe(() => {
      const currentCode = this.selectedOffer()?.productCode;
      const updatedOffers = this.allOffers();
      const matched = updatedOffers.find((o) => o.productCode === currentCode) || updatedOffers[0];
      if (matched) {
        this.selectedOffer.set(matched);
      }
    });

    // Load existing loan applications to hydrate activeLoans + draftApplications signals
    this.loanService.listLoanApplications().subscribe((apps) => {
      const drafts = apps.filter((a) => a.applicationStatus === 'DRAFT');
      if (drafts.length > 0 && !this.draftDialogDismissed) {
        // Show draft dialog immediately — the page skeleton covers the transition
        this.activeDraft.set(drafts[0]);
        this.showDraftDialog.set(true);
      }
    });

    // Wire debounced quote recalculation: slider/tenure changes → API call with 800ms debounce
    this.quoteParams$
      .pipe(
        debounceTime(800),
        distinctUntilChanged((a, b) => a.amount === b.amount && a.tenure === b.tenure),
        switchMap(({ amount, tenure }) => {
          if (!tenure || tenure <= 0 || amount <= 0) return [];
          const offer = this.selectedOffer();
          return this.loanService.recalculateQuote(
            'DRAFT-SESSION-REF',
            offer.productCode as LoanProductCode,
            amount,
            tenure,
          );
        }),
        takeUntil(this.destroy$),
      )
      .subscribe();

    // Handle route query params (e.g. /loans?type=personal or /loans?mode=enquire)
    this.route.queryParams.subscribe((params) => {
      const type = params['type'] as LoanType | undefined;
      const mode = params['mode'] as string | undefined;

      if (mode === 'enquire' || mode === 'custom') {
        this.activeViewMode.set('custom_enquiry');
      }

      if (type) {
        this.activeNavId.set(`loans-${type}`);
        const foundOffer = this.allOffers().find((o) => o.type === type);
        if (foundOffer) {
          this.selectPreApprovedOffer(foundOffer);
        }
        const foundCustom = this.customCategories.find((c) => c.id === type);
        if (foundCustom) {
          this.selectCustomCategory(foundCustom);
        }
      } else {
        this.activeNavId.set('loans');
        const personalOffer =
          this.allOffers().find((o) => o.type === 'personal') || this.allOffers()[0];
        if (personalOffer) {
          this.selectPreApprovedOffer(personalOffer);
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Pre-Approved Flow Handlers ──────────────────────────────────
  selectPreApprovedOffer(offer: PreApprovedLoanOffer): void {
    this.selectedOffer.set(offer);
    const defAmt = Math.min(
      Math.max(offer.defaultAmount || offer.minAmount, offer.minAmount),
      offer.maxAmount,
    );
    this.appliedAmount.set(defAmt);
    this.tenureMonths.set(null);
    this.tenureValidationError.set(false);
    this.termsAgreed.set(false);
    this.loanService.liveQuote.set(null); // reset live quote when offer changes
  }

  selectTenure(tenure: number): void {
    if (this.tenureMonths() === tenure) {
      this.tenureMonths.set(null);
      this.loanService.liveQuote.set(null);
    } else {
      this.tenureMonths.set(tenure);
      this.tenureValidationError.set(false);
      // Trigger debounced quote recalculation immediately on chip select
      this.quoteParams$.next({ amount: this.appliedAmount(), tenure });
    }
  }

  /** Called by the range slider's (input) event to debounce quote recalculation. */
  onAmountChange(event: Event): void {
    const val = Number((event.target as HTMLInputElement).value);
    this.appliedAmount.set(val);
    if (this.tenureMonths()) {
      this.quoteParams$.next({ amount: val, tenure: this.tenureMonths() });
    }
  }

  /** Called by Quick Select preset buttons. */
  setAmountPreset(amount: number): void {
    this.appliedAmount.set(amount);
    if (this.tenureMonths()) {
      this.quoteParams$.next({ amount, tenure: this.tenureMonths() });
    }
  }

  startPreApprovedFlow(): void {
    this.tenureMonths.set(null); // Reset tenure to ensure user picks one
    this.tenureValidationError.set(false);
    this.preApprovedStep.set('customise');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ─── Draft Resume Dialog Handlers ─────────────────────────────────────────

  /**
   * User clicked "Continue Application" in the draft dialog.
   * Restores the wizard state from the draft and navigates to the correct step.
   */
  resumeDraftApplication(): void {
    const draft = this.activeDraft();
    if (!draft) return;

    this.showDraftDialog.set(false);
    this.draftDialogDismissed = true;

    // Find and select the matching offer
    const matchedOffer = this.allOffers().find((o) => o.productCode === draft.productCode);
    if (matchedOffer) {
      this.selectedOffer.set(matchedOffer);
      this.appliedAmount.set(draft.requestedAmount);
      this.tenureMonths.set(draft.requestedTenureMonths);
      this.loanService.liveQuote.set(null); // will be recalculated
    }

    // Navigate to the correct wizard step based on currentSection
    const stepMap: Record<string, PreApprovedStep> = {
      PERSONAL_DETAILS: 'customise',
      LOAN_REQUIREMENT: 'verify_docs',
      REVIEW: 'terms',
      SUBMITTED: 'confirm',
    };
    const resumeStep: PreApprovedStep = stepMap[draft.currentSection] ?? 'customise';
    this.preApprovedStep.set(resumeStep);
    this.activeViewMode.set('pre_approved');
    this.showToast(
      'info',
      `Resuming your ${draft.productName} application from ${this.getDraftSectionLabel(draft.currentSection)}.`,
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Immediately trigger a quote recalculation for the restored values
    if (draft.requestedTenureMonths > 0 && draft.requestedAmount > 0) {
      this.loanService
        .recalculateQuote(
          draft.applicationReference,
          draft.productCode,
          draft.requestedAmount,
          draft.requestedTenureMonths,
        )
        .subscribe();
    }
  }

  /** Dismisses the draft dialog without resuming and suppresses it for the session. */
  dismissDraftDialog(): void {
    this.showDraftDialog.set(false);
    this.draftDialogDismissed = true;
  }

  /** Converts a backend `currentSection` value to a human-readable step label. */
  getDraftSectionLabel(section: string): string {
    const map: Record<string, string> = {
      PERSONAL_DETAILS: 'Step 1 · Loan Configuration',
      LOAN_REQUIREMENT: 'Step 2 · Document Verification',
      REVIEW: 'Step 3 · Terms & Consent',
      SUBMITTED: 'Step 4 · Confirm & Disburse',
    };
    return map[section] ?? 'the beginning';
  }

  goToVerifyDocs(): void {
    if (!this.tenureMonths() || this.tenureMonths()! <= 0) {
      this.tenureValidationError.set(true);
      const min = this.selectedOffer()?.minTenureMonths ?? 6;
      const max = this.selectedOffer()?.maxTenureMonths ?? 60;
      this.showToast(
        'error',
        `Action Required: Please select a repayment tenure duration chip (${min}M - ${max}M) to proceed.`,
      );
      const el = document.getElementById('tenure-selection-card');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    this.tenureValidationError.set(false);
    this.preApprovedStep.set('verify_docs');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  goToTerms(): void {
    this.preApprovedStep.set('terms');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  acceptTermsAndProceed(): void {
    if (!this.termsAgreed()) {
      this.showToast('info', 'Please agree to the loan terms and conditions to proceed.');
      return;
    }
    this.preApprovedStep.set('confirm');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  confirmAndDisburse(): void {
    this.isDisbursing.set(true);

    const offer = this.selectedOffer();
    const profile = this.customerProfile();

    const payload: LoanApplicationPayload = {
      productCode: offer.productCode as LoanProductCode,
      applicationReference: null, // new application
      // Personal details section
      fullName: this.customerFullName(),
      mobileNumber: profile?.mobileNumber ?? '9999999999',
      fatherName: 'N/A', // not captured in UI; backend accepts any string
      emailId: this.customerEmail(),
      addressLine: 'Jalgaon, Maharashtra',
      postalCode: '425001',
      dateOfBirth: '1990-01-01', // placeholder — extend profile model to capture DOB if needed
      // Loan requirement section
      requestedAmount: this.appliedAmount(),
      requestedTenureMonths: this.tenureMonths() ?? 36,
      loanPurpose: `${offer.title} requirement`,
      // Submission fields
      creditAccountReference: 'ACC-COSM-1002', // first eligible account; can be made dynamic
      communicationEmail: this.customerEmail(),
      termsAccepted: true,
      termsVersion: 'LOAN_TERMS_V1',
    };

    this.loanService.submitLoanApplication(payload).subscribe({
      next: (res: LoanSanctionResponse) => {
        this.isDisbursing.set(false);
        this.sanctionResponse.set(res);
        this.preApprovedStep.set('success');
        this.showToast('success', 'Loan application submitted successfully!');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        // Refresh active loans list
        this.loanService.listLoanApplications().subscribe();
      },
      error: () => {
        this.isDisbursing.set(false);
        this.showToast('error', 'Submission failed. Please retry.');
      },
    });
  }

  resetPreApprovedFlow(): void {
    this.preApprovedStep.set('overview');
    this.termsAgreed.set(false);
    this.sanctionResponse.set(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ── Custom Loan Enquiry Handlers ────────────────────────────────
  selectCustomCategory(category: CustomCategoryInfo): void {
    this.selectedCustomCategory.set(category);
    this.customAmount.set(category.defaultAmount);
    this.customTenureYears.set(category.defaultTenureYears);
  }

  proceedToApplicant(): void {
    this.customStep.set('applicant');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  submitCustomEnquiry(): void {
    this.isSubmittingCustom.set(true);

    const payload: CustomLoanEnquiryPayload = {
      loanCategory: this.selectedCustomCategory().id,
      customLoanTitle: this.selectedCustomCategory().name,
      requiredAmount: this.customAmount(),
      tenureYears: this.customTenureYears(),
      tenureMonths: this.customTenureYears() * 12,
      loanPurpose: `${this.selectedCustomCategory().name} requirement`,
      employmentType: this.customEmploymentType(),
      monthlyIncome: this.customMonthlyIncome(),
      existingMonthlyEmi: this.customExistingEmi(),
      preferredBankCode: 'BANK0004',
      preferredBranch: 'Jalgaon Main Branch',
      applicantName: this.customerFullName(),
      applicantMobile: this.customerMobile(),
      applicantEmail: this.customerEmail(),
      specialRemarks: 'Fast-track online application enquiry',
    };

    this.loanService.submitCustomLoanEnquiry(payload).subscribe({
      next: (res: LoanEnquiryResponse) => {
        this.isSubmittingCustom.set(false);
        this.customEnquiryResult.set(res);
        this.customStep.set('success');
        this.showToast('success', 'Loan enquiry registered! Dedicated loan manager assigned.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: () => {
        this.isSubmittingCustom.set(false);
        this.showToast('error', 'Failed to submit loan enquiry. Please retry.');
      },
    });
  }

  resetCustomFlow(): void {
    this.customStep.set('configure');
    this.customEnquiryResult.set(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ── General Navigation Handlers ────────────────────────────────
  switchViewMode(mode: 'pre_approved' | 'custom_enquiry'): void {
    this.activeViewMode.set(mode);
    if (mode === 'pre_approved') {
      this.preApprovedStep.set('overview');
    } else {
      this.customStep.set('configure');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onNavChange(navId: string): void {
    if (navId.startsWith('loans-')) {
      const type = navId.replace('loans-', '');
      this.activeNavId.set(navId);
      const foundOffer = this.allOffers().find((o) => o.type === type);
      if (foundOffer) {
        this.activeViewMode.set('pre_approved');
        this.selectPreApprovedOffer(foundOffer);
        this.preApprovedStep.set('overview');
      } else {
        const foundCustom = this.customCategories.find((c) => c.id === type);
        if (foundCustom) {
          this.activeViewMode.set('custom_enquiry');
          this.selectCustomCategory(foundCustom);
          this.customStep.set('configure');
        }
      }
    } else if (navId === 'loans') {
      this.activeNavId.set('loans');
      this.activeViewMode.set('pre_approved');
      this.preApprovedStep.set('overview');
    } else if (navId === 'dashboard') {
      this.router.navigate(['/dashboard']);
    } else if (navId === 'balance-enquiry') {
      this.router.navigate(['/balance-enquiry']);
    } else if (navId === 'profile') {
      this.router.navigate(['/profile']);
    }
  }

  formatInr(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  showToast(type: 'success' | 'info' | 'error', text: string): void {
    this.toastMessage.set({ type, text });
    setTimeout(() => {
      if (this.toastMessage()?.text === text) {
        this.toastMessage.set(null);
      }
    }, 4500);
  }
}
