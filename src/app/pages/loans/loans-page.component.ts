import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
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
export class LoansPageComponent implements OnInit {
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

  // View Mode: 'pre_approved' (Default pre-approved catalog) | 'custom_enquiry' (New / Different loan requirement)
  readonly activeViewMode = signal<'pre_approved' | 'custom_enquiry'>('pre_approved');

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
  readonly emiCalculation = computed<LoanCalculationResult>(() => {
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
    if (!this.profileService.profile()) {
      this.profileService.fetchProfile().subscribe();
    }

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

  // ── Pre-Approved Flow Handlers ──────────────────────────────────
  selectPreApprovedOffer(offer: PreApprovedLoanOffer): void {
    this.selectedOffer.set(offer);
    const defAmt = Math.min(offer.defaultAmount || 300000, offer.maxAmount);
    this.appliedAmount.set(defAmt);
    this.tenureMonths.set(null); // Unset to force explicit user selection
    this.termsAgreed.set(false);
  }

  selectTenure(tenure: number): void {
    if (this.tenureMonths() === tenure) {
      this.tenureMonths.set(null);
    } else {
      this.tenureMonths.set(tenure);
      this.tenureValidationError.set(false);
    }
  }

  startPreApprovedFlow(): void {
    this.tenureMonths.set(null); // Reset tenure to ensure user picks one
    this.tenureValidationError.set(false);
    this.preApprovedStep.set('customise');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  goToVerifyDocs(): void {
    if (!this.tenureMonths() || this.tenureMonths()! <= 0) {
      this.tenureValidationError.set(true);
      this.showToast(
        'error',
        'Action Required: Please select a repayment tenure duration chip (12M, 24M, 36M, 48M, or 60M) to proceed.',
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

    const payload: LoanApplicationPayload = {
      loanId: this.selectedOffer().id,
      loanType: this.selectedOffer().type,
      appliedAmount: this.appliedAmount(),
      tenureMonths: this.tenureMonths() || 36,
      disbursalAccount: 'Primary Savings A/C •••• 4521',
      interestRate: this.selectedOffer().interestRate,
      monthlyEmi: this.emiCalculation().monthlyEmi,
      customerId: this.customerProfile()?.customerId || 'SSPL-CUST-84920',
      documentsVerified: true,
      agreeKfs: true,
      agreeNach: true,
      agreeCreditBureau: true,
    };

    this.loanService.submitLoanApplication(payload).subscribe({
      next: (res: LoanSanctionResponse) => {
        this.isDisbursing.set(false);
        this.sanctionResponse.set(res);
        this.preApprovedStep.set('success');
        this.showToast('success', 'Loan amount sanctioned and disbursed successfully!');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: () => {
        this.isDisbursing.set(false);
        this.showToast('error', 'Disbursal request failed. Please try again.');
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
