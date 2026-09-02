import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil, switchMap, catchError } from 'rxjs/operators';
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
  LoanApplicationStatus,
  LoanJourneyState,
  LoanQuoteCalculation,
} from '../../models';
import { LoanApplicationsListComponent } from '../../components/loan-applications-list/loan-applications-list.component';

export type PreApprovedStep =
  | 'overview'
  | 'personal_details'
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
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    SideNavComponent,
    DashboardHeaderComponent,
    LoanApplicationsListComponent,
  ],
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
  // All loan applications (draft, submitted, ongoing) from list/loan/applications
  readonly loanApplications = this.loanService.loanApplications;
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
  /** True while checking /loan/journey on button click. */
  readonly isStartingJourney = signal<boolean>(false);
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

  // ── Personal Details Step State (Mandatory KYC Form) ──────────────
  readonly personalFullName = signal<string>('');
  readonly personalMobileNumber = signal<string>('');
  readonly personalFatherName = signal<string>('');
  readonly personalEmailId = signal<string>('');
  readonly personalAddressLine = signal<string>('');
  readonly personalPostalCode = signal<string>('');
  readonly personalDateOfBirth = signal<string>('');

  readonly isSavingPersonalDetails = signal<boolean>(false);
  readonly personalFormErrors = signal<Record<string, string>>({});
  readonly currentApplicationReference = signal<string | null>(null);

  // Sliders & Customization
  readonly appliedAmount = signal<number>(300000);
  readonly tenureMonths = signal<number | null>(null);
  readonly tenureValidationError = signal<boolean>(false);
  readonly isSavingRequirement = signal<boolean>(false);
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
    this.currentApplicationReference.set(null);

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

    // Load existing loan applications to hydrate activeLoans + draftApplications signals (no prompt on product list)
    this.loanService.listLoanApplications().subscribe();

    // Wire debounced quote recalculation: slider/tenure changes → API call with 800ms debounce
    this.quoteParams$
      .pipe(
        debounceTime(800),
        distinctUntilChanged((a, b) => a.amount === b.amount && a.tenure === b.tenure),
        switchMap(({ amount, tenure }) => {
          if (!tenure || tenure <= 0 || amount <= 0) return [];
          const appRef = this.currentApplicationReference();
          if (!appRef) {
            console.warn('[LoansPage] No applicationReference available for calculate/loan/quote');
            return [];
          }
          const offer = this.selectedOffer();
          return this.loanService
            .recalculateQuote(
              appRef,
              offer.productCode as LoanProductCode,
              amount,
              tenure,
            )
            .pipe(
              catchError((err) => {
                console.error('[LoansPage] calculateLoanQuote failed:', err);
                return [];
              }),
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

      const ref = params['ref'] as string | undefined;
      if (ref) {
        this.loanService.listLoanApplications().subscribe((apps) => {
          const found = apps.find((a) => a.applicationReference === ref);
          if (found) {
            this.resumeSpecificApplication(found);
          }
        });
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
    this.currentApplicationReference.set(null);
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

  /**
   * Triggered on clicking 'Customise & Apply Now'.
   * Calls /loan/journey with the selected productCode.
   * If applicationAlreadyExists is true -> prompts "Continue where you left off".
   * If applicationAlreadyExists is false -> lands on Personal Details without customer submitted data and applicationReference: null.
   */
  startPreApprovedFlow(): void {
    const productCode = this.selectedOffer().productCode as LoanProductCode;
    this.isStartingJourney.set(true);

    this.loanService.initLoanJourney(productCode).subscribe({
      next: (journey) => {
        this.isStartingJourney.set(false);
        this.journeyState.set(journey);

        if (journey.applicationAlreadyExists && journey.applicationReference) {
          this.currentApplicationReference.set(journey.applicationReference);
          const matchedOffer =
            this.allOffers().find((o) => o.productCode === journey.requestedProductCode) ||
            this.selectedOffer();
          if (matchedOffer) {
            this.selectedOffer.set(matchedOffer);
          }

          // Directly display Step 5 ("Confirm and Disburse" / "Loan Sanction Summary")
          // on /banking/loan/journey when currentSection is "REVIEW", skipping documents and consent steps.
          if (journey.currentSection === 'REVIEW') {
            this.activeViewMode.set('pre_approved');
            this.showDraftDialog.set(false);
            this.draftDialogDismissed = true;

            this.loanService.getLoanApplication(journey.applicationReference).subscribe({
              next: (detail) => {
                if (detail?.loanRequirement) {
                  if (detail.loanRequirement.requestedAmount > 0) {
                    this.appliedAmount.set(detail.loanRequirement.requestedAmount);
                  }
                  if (detail.loanRequirement.requestedTenureMonths > 0) {
                    this.tenureMonths.set(detail.loanRequirement.requestedTenureMonths);
                  }
                }
                if (detail?.personalDetails) {
                  if (detail.personalDetails.fullName) this.personalFullName.set(detail.personalDetails.fullName);
                  if (detail.personalDetails.mobileNumber) this.personalMobileNumber.set(detail.personalDetails.mobileNumber);
                  if (detail.personalDetails.fatherName) this.personalFatherName.set(detail.personalDetails.fatherName);
                  if (detail.personalDetails.emailId) this.personalEmailId.set(detail.personalDetails.emailId);
                  if (detail.personalDetails.addressLine) this.personalAddressLine.set(detail.personalDetails.addressLine);
                  if (detail.personalDetails.postalCode) this.personalPostalCode.set(detail.personalDetails.postalCode);
                  if (detail.personalDetails.dateOfBirth) this.personalDateOfBirth.set(detail.personalDetails.dateOfBirth);
                }
                if (!this.tenureMonths() || this.tenureMonths()! <= 0) {
                  this.tenureMonths.set(matchedOffer.minTenureMonths || 36);
                }
                this.preApprovedStep.set('confirm');
                this.showToast(
                  'info',
                  `Displaying Loan Sanction Summary for application ${journey.applicationReference}.`,
                );
                window.scrollTo({ top: 0, behavior: 'smooth' });
              },
              error: () => {
                if (!this.tenureMonths() || this.tenureMonths()! <= 0) {
                  this.tenureMonths.set(matchedOffer.minTenureMonths || 36);
                }
                this.preApprovedStep.set('confirm');
                this.showToast(
                  'info',
                  `Displaying Loan Sanction Summary for application ${journey.applicationReference}.`,
                );
                window.scrollTo({ top: 0, behavior: 'smooth' });
              },
            });
            return;
          }

          // Otherwise (for other sections like PERSONAL_DETAILS or LOAN_REQUIREMENT), prompt the resume dialog
          this.activeDraft.set({
            applicationReference: journey.applicationReference,
            productCode: journey.requestedProductCode,
            productName: journey.applicationProductName || matchedOffer.title,
            requestedAmount: matchedOffer.defaultAmount || matchedOffer.minAmount,
            requestedTenureMonths: matchedOffer.minTenureMonths || 36,
            estimatedEmi: 0,
            applicationStatus: (journey.applicationStatus as LoanApplicationStatus) || 'DRAFT',
            statusDisplayName: 'Draft',
            currentSection: journey.currentSection || 'PERSONAL_DETAILS',
            maskedCreditAccount: 'XXXXXXXX0002',
            lastUpdatedChannel: journey.lastUpdatedChannel ?? 'WEB',
            sourceChannel: journey.sourceChannel ?? 'WEB',
            createdAt: Date.now(),
            submittedAt: 0,
            updatedAt: journey.updatedAt ?? Date.now(),
          });
          this.showDraftDialog.set(true);
        } else {
          // applicationAlreadyExists is false -> land on Personal Details without submitted data and applicationReference: null
          this.currentApplicationReference.set(null);
          this.personalFullName.set('');
          this.personalMobileNumber.set('');
          this.personalFatherName.set('');
          this.personalEmailId.set('');
          this.personalAddressLine.set('');
          this.personalPostalCode.set('');
          this.personalDateOfBirth.set('');
          this.personalFormErrors.set({});
          this.tenureMonths.set(null);
          this.tenureValidationError.set(false);
          this.preApprovedStep.set('personal_details');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      },
      error: () => {
        this.isStartingJourney.set(false);
        this.currentApplicationReference.set(null);
        this.personalFullName.set('');
        this.personalMobileNumber.set('');
        this.personalFatherName.set('');
        this.personalEmailId.set('');
        this.personalAddressLine.set('');
        this.personalPostalCode.set('');
        this.personalDateOfBirth.set('');
        this.personalFormErrors.set({});
        this.tenureMonths.set(null);
        this.tenureValidationError.set(false);
        this.preApprovedStep.set('personal_details');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
    });
  }

  /** Saves primary applicant personal details via /save/loan/personaldetails API then advances to customise step. */
  savePersonalDetailsAndProceed(): void {
    const fullName = this.personalFullName().trim();
    const mobile = this.personalMobileNumber().trim();
    const fatherName = this.personalFatherName().trim();
    const email = this.personalEmailId().trim();
    const address = this.personalAddressLine().trim();
    const postalCode = this.personalPostalCode().trim();
    const dob = this.personalDateOfBirth().trim();

    const errors: Record<string, string> = {};

    if (!fullName) {
      errors['fullName'] = 'Full Name is required.';
    }
    if (!mobile || !/^\d{10}$/.test(mobile.replace(/\D/g, ''))) {
      errors['mobileNumber'] = 'A valid 10-digit mobile number is required.';
    }
    if (!fatherName) {
      errors['fatherName'] = "Father's / Guardian's Name is required.";
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors['emailId'] = 'A valid email address is required.';
    }
    if (!address) {
      errors['addressLine'] = 'Residential address is required.';
    }
    if (!postalCode || !/^\d{6}$/.test(postalCode.replace(/\D/g, ''))) {
      errors['postalCode'] = 'A valid 6-digit postal PIN code is required.';
    }
    if (!dob) {
      errors['dateOfBirth'] = 'Date of birth is required (YYYY-MM-DD).';
    }

    this.personalFormErrors.set(errors);

    if (Object.keys(errors).length > 0) {
      this.showToast('error', 'Action Required: Please complete all mandatory personal details.');
      return;
    }

    this.isSavingPersonalDetails.set(true);

    const payload = {
      applicationReference: this.currentApplicationReference() ?? null,
      productCode: this.selectedOffer().productCode,
      fullName,
      mobileNumber: mobile,
      fatherName,
      emailId: email,
      addressLine: address,
      postalCode,
      dateOfBirth: dob,
    };

    this.loanService.saveLoanPersonalDetails(payload).subscribe({
      next: (res) => {
        this.isSavingPersonalDetails.set(false);
        if (res?.applicationReference) {
          this.currentApplicationReference.set(res.applicationReference);
        }
        this.showToast('success', 'Personal details saved successfully!');

        // Route to customise loan when nextSection is LOAN_REQUIREMENT
        if (res?.nextSection === 'LOAN_REQUIREMENT' || !res?.nextSection) {
          this.preApprovedStep.set('customise');
        } else {
          this.preApprovedStep.set('customise');
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: (err) => {
        this.isSavingPersonalDetails.set(false);
        const errMsg =
          err?.error?.header?.errorMessage ||
          err?.message ||
          'Failed to save personal details. Please retry.';
        if (
          err?.error?.header?.errorCode === '5721' ||
          errMsg.includes('not found') ||
          errMsg.includes('5721')
        ) {
          this.currentApplicationReference.set(null);
        }
        this.showToast('error', errMsg);
      },
    });
  }

  // ─── Draft Resume Dialog Handlers ─────────────────────────────────────────

  /**
   * User clicked "Continue Application" in the draft dialog.
   * Restores the wizard state from the draft and navigates to the correct step.
   */
  resumeDraftApplication(): void {
    const draft = this.activeDraft();
    const journey = this.journeyState();
    const appRef = journey?.applicationReference || draft?.applicationReference;
    if (appRef) {
      this.currentApplicationReference.set(appRef);
    }
    this.showDraftDialog.set(false);
    this.draftDialogDismissed = true;

    // Find and select the matching offer
    const productCode =
      journey?.requestedProductCode || draft?.productCode || this.selectedOffer().productCode;
    const matchedOffer = this.allOffers().find((o) => o.productCode === productCode);
    if (matchedOffer) {
      this.selectedOffer.set(matchedOffer);
      if (draft && draft.requestedAmount > 0) {
        this.appliedAmount.set(draft.requestedAmount);
      }
      if (draft && draft.requestedTenureMonths > 0) {
        this.tenureMonths.set(draft.requestedTenureMonths);
      }
      this.loanService.liveQuote.set(null);
    }

    // Navigate to the correct wizard step based on currentSection
    const currentSec = journey?.currentSection || draft?.currentSection || 'PERSONAL_DETAILS';
    const stepMap: Record<string, PreApprovedStep> = {
      PERSONAL_DETAILS: 'personal_details',
      LOAN_REQUIREMENT: 'customise',
      REVIEW: 'confirm',
      SUBMITTED: 'confirm',
    };
    const resumeStep: PreApprovedStep = stepMap[currentSec] ?? 'personal_details';
    this.preApprovedStep.set(resumeStep);
    this.activeViewMode.set('pre_approved');
    this.showToast(
      'info',
      `Resuming application ${appRef} from ${this.getDraftSectionLabel(currentSec)}.`,
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Immediately trigger a quote recalculation for the restored values if in customise
    if (resumeStep === 'customise' && this.tenureMonths() && this.appliedAmount() > 0) {
      const activeRef = this.currentApplicationReference() ?? appRef;
      if (activeRef) {
        this.loanService
          .recalculateQuote(
            activeRef,
            productCode as LoanProductCode,
            this.appliedAmount(),
            this.tenureMonths()!,
          )
          .subscribe();
      }
    }
  }

  /**
   * Resumes a specific application (e.g. from the ongoing/draft cards list).
   */
  resumeSpecificApplication(app: LoanApplicationSummary): void {
    if (!app) return;
    this.currentApplicationReference.set(app.applicationReference);
    this.showDraftDialog.set(false);
    this.draftDialogDismissed = true;

    // Find and select the matching offer
    const matchedOffer =
      this.allOffers().find((o) => o.productCode === app.productCode) || this.selectedOffer();
    this.selectedOffer.set(matchedOffer);

    if (app.requestedAmount > 0) {
      this.appliedAmount.set(app.requestedAmount);
    }
    if (app.requestedTenureMonths > 0) {
      this.tenureMonths.set(app.requestedTenureMonths);
    }
    this.loanService.liveQuote.set(null);

    // Map section to wizard step
    const stepMap: Record<string, PreApprovedStep> = {
      PERSONAL_DETAILS: 'personal_details',
      LOAN_REQUIREMENT: 'customise',
      REVIEW: 'confirm',
      SUBMITTED: 'confirm',
    };
    const resumeStep: PreApprovedStep = stepMap[app.currentSection] ?? 'personal_details';
    this.preApprovedStep.set(resumeStep);
    this.activeViewMode.set('pre_approved');

    if (resumeStep === 'confirm') {
      this.loanService.getLoanApplication(app.applicationReference).subscribe({
        next: (detail) => {
          if (detail?.loanRequirement) {
            if (detail.loanRequirement.requestedAmount > 0) {
              this.appliedAmount.set(detail.loanRequirement.requestedAmount);
            }
            if (detail.loanRequirement.requestedTenureMonths > 0) {
              this.tenureMonths.set(detail.loanRequirement.requestedTenureMonths);
            }
          }
          if (detail?.personalDetails) {
            if (detail.personalDetails.fullName) this.personalFullName.set(detail.personalDetails.fullName);
            if (detail.personalDetails.mobileNumber) this.personalMobileNumber.set(detail.personalDetails.mobileNumber);
            if (detail.personalDetails.fatherName) this.personalFatherName.set(detail.personalDetails.fatherName);
            if (detail.personalDetails.emailId) this.personalEmailId.set(detail.personalDetails.emailId);
            if (detail.personalDetails.addressLine) this.personalAddressLine.set(detail.personalDetails.addressLine);
            if (detail.personalDetails.postalCode) this.personalPostalCode.set(detail.personalDetails.postalCode);
            if (detail.personalDetails.dateOfBirth) this.personalDateOfBirth.set(detail.personalDetails.dateOfBirth);
          }
          if (!this.tenureMonths() || this.tenureMonths()! <= 0) {
            this.tenureMonths.set(matchedOffer.minTenureMonths || 36);
          }
        },
      });
    } else if (resumeStep === 'customise' && this.tenureMonths() && this.appliedAmount() > 0) {
      this.loanService
        .recalculateQuote(
          app.applicationReference,
          app.productCode as LoanProductCode,
          this.appliedAmount(),
          this.tenureMonths()!,
        )
        .subscribe();
    }

    this.showToast(
      'info',
      `Resuming application ${app.applicationReference} from ${this.getDraftSectionLabel(app.currentSection)}.`,
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /** Dismisses the draft dialog to start fresh with blank personal details and applicationReference: null. */
  dismissDraftDialog(): void {
    this.showDraftDialog.set(false);
    this.draftDialogDismissed = true;
    this.currentApplicationReference.set(null);
    this.personalFullName.set('');
    this.personalMobileNumber.set('');
    this.personalFatherName.set('');
    this.personalEmailId.set('');
    this.personalAddressLine.set('');
    this.personalPostalCode.set('');
    this.personalDateOfBirth.set('');
    this.personalFormErrors.set({});
    this.tenureMonths.set(null);
    this.tenureValidationError.set(false);
    this.preApprovedStep.set('personal_details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /** Converts a backend `currentSection` value to a human-readable step label. */
  getDraftSectionLabel(section: string): string {
    const map: Record<string, string> = {
      PERSONAL_DETAILS: 'Step 1 · Personal Details',
      LOAN_REQUIREMENT: 'Step 2 · Customise Loan',
      REVIEW: 'Step 5 · Confirm & Disburse',
      SUBMITTED: 'Step 5 · Confirm & Disburse',
    };
    return map[section] ?? 'the beginning';
  }

  /**
   * On click of 'Verify documents' button:
   * Calls /banking/save/loan/requirement with persisting applicationReference before advancing to 'verify_docs' step.
   * Keeps existing flow intact (Verify Documents -> Terms & Consent -> Confirm & Disburse).
   */
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

    const appRef = this.currentApplicationReference();
    if (!appRef) {
      this.showToast('error', 'Loan application reference is missing. Please save personal details first.');
      return;
    }

    const quoteRef =
      this.loanService.liveQuote()?.quoteReference ||
      `QUOTE-${new Date().getFullYear()}-${Math.floor(10000000 + Math.random() * 89999999)}`;

    const purposeMap: Record<string, string> = {
      PERSONAL_LOAN: 'Personal requirement',
      HOME_LOAN: 'Home purchase / renovation requirement',
      VEHICLE_LOAN: 'Vehicle purchase requirement',
      BUSINESS_LOAN: 'Business expansion requirement',
    };

    const payload = {
      applicationReference: appRef,
      quoteReference: quoteRef,
      productCode: this.selectedOffer().productCode as LoanProductCode,
      requestedAmount: this.appliedAmount(),
      requestedTenureMonths: this.tenureMonths()!,
      loanPurpose: purposeMap[this.selectedOffer().productCode] || `${this.selectedOffer().title} requirement`,
    };

    this.isSavingRequirement.set(true);
    this.loanService.saveLoanRequirement(payload).subscribe({
      next: (res) => {
        this.isSavingRequirement.set(false);
        if (res?.applicationReference) {
          this.currentApplicationReference.set(res.applicationReference);
        }
        this.showToast('success', 'Loan requirements saved successfully!');
        this.tenureValidationError.set(false);
        // Do not change next steps (Verify Document -> Terms & Consent -> Confirm)
        this.preApprovedStep.set('verify_docs');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: (err) => {
        this.isSavingRequirement.set(false);
        const errMsg =
          err?.error?.header?.errorMessage ||
          err?.message ||
          'Failed to save loan requirements. Please retry.';
        this.showToast('error', errMsg);
      },
    });
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
      applicationReference: this.currentApplicationReference(),
      // Personal details section
      fullName: this.personalFullName().trim(),
      mobileNumber: this.personalMobileNumber().trim(),
      fatherName: this.personalFatherName().trim(),
      emailId: this.personalEmailId().trim(),
      addressLine: this.personalAddressLine().trim(),
      postalCode: this.personalPostalCode().trim(),
      dateOfBirth: this.personalDateOfBirth().trim(),
      // Loan requirement section
      requestedAmount: this.appliedAmount(),
      requestedTenureMonths: this.tenureMonths() ?? 36,
      loanPurpose: `${offer.title} requirement`,
      // Submission fields
      creditAccountReference: 'ACC-COSM-1002', // first eligible account; can be made dynamic
      communicationEmail: this.personalEmailId().trim(),
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
    this.currentApplicationReference.set(null);
    this.personalFormErrors.set({});
    this.personalFullName.set('');
    this.personalMobileNumber.set('');
    this.personalFatherName.set('');
    this.personalEmailId.set('');
    this.personalAddressLine.set('');
    this.personalPostalCode.set('');
    this.personalDateOfBirth.set('');
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
