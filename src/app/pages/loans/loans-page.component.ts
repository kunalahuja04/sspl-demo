import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SideNavComponent } from '../../components/side-nav/side-nav.component';
import { DashboardHeaderComponent } from '../dashboard/components/dashboard-header/dashboard-header.component';
import { LoanService } from '../../services/loan.service';
import { BankService } from '../../services/bank.service';
import { AuthService } from '../../services/auth.service';
import {
  LoanType,
  PreApprovedLoanOffer,
  LoanCalculationResult,
  LoanSanctionResponse,
} from '../../models';

interface CategoryTab {
  id: string;
  label: string;
  type?: LoanType | 'all';
  icon: string;
}

export interface LoanDocumentItem {
  id: string;
  title: string;
  subtitle: string;
  fileName: string;
  fileSize: string;
  status: 'VERIFIED' | 'UPLOADED' | 'OPTIONAL';
  iconType: 'id' | 'income' | 'bank' | 'address';
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
  ],
  templateUrl: './loans-page.component.html',
  styleUrl: './loans-page.component.scss',
})
export class LoansPageComponent implements OnInit {
  private loanService = inject(LoanService);
  private bankService = inject(BankService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // Active navigation ID for side navbar
  readonly activeNavId = signal<string>('loans');

  // Selected Bank & User Profile
  readonly selectedBank = this.bankService.selectedBank;
  readonly currentUser = this.authService.currentUser;
  readonly bankingMetrics = this.loanService.bankingHealthMetrics;

  // Loan Offers from Service
  readonly allOffers = this.loanService.offers;
  readonly selectedOffer = this.loanService.selectedOffer;

  // Filter category state ('all' | 'home' | 'personal' | 'car' | 'education' | 'business' | 'gold')
  readonly activeCategory = signal<string>('all');

  // Slider & Customization Interactive State
  readonly appliedAmount = signal<number>(3500000);
  readonly tenureMonths = signal<number>(180);
  readonly amountInput = signal<number>(3500000);

  // ── Multi-Step Application Modal State ─────────────────────────
  // Step 1: Review Terms & Account
  // Step 2: Dummy Documents Verification
  // Step 3: Key Fact Statement (KFS) & Terms Consent
  // Step 4: e-Sign & High-Security OTP
  // Step 5: Application Submitted & Under Review (Progress Stepper)
  readonly isApplicationModalOpen = signal<boolean>(false);
  readonly modalStep = signal<1 | 2 | 3 | 4 | 5>(1);
  readonly selectedDisbursalAccount = signal<string>('Primary Savings A/C •••• 0001');

  // Dummy Documents Collection
  readonly dummyDocuments = signal<LoanDocumentItem[]>([
    {
      id: 'pan',
      title: 'PAN Card / Tax Identity',
      subtitle: 'Auto-verified with NSDL Income Tax Database',
      fileName: 'PAN_CARD_VERIFIED_ABCDE1234F.pdf',
      fileSize: '420 KB',
      status: 'VERIFIED',
      iconType: 'id',
    },
    {
      id: 'salary',
      title: 'Income Proof / Salary Slips (Last 3 Mo)',
      subtitle: 'Employer: Infosys Technologies Ltd (Verified)',
      fileName: 'Salary_Slips_Q1_2026.pdf',
      fileSize: '1.8 MB',
      status: 'UPLOADED',
      iconType: 'income',
    },
    {
      id: 'bank-stmt',
      title: 'Bank Statement (6 Months)',
      subtitle: 'Auto-fetched & stamped from SSPL Core Banking',
      fileName: 'Bank_Statement_JJBL_6M.pdf',
      fileSize: '3.2 MB',
      status: 'VERIFIED',
      iconType: 'bank',
    },
    {
      id: 'address',
      title: 'Aadhaar e-KYC / Address Proof',
      subtitle: 'Digitally verified with UIDAI biometric vault',
      fileName: 'Aadhaar_eKYC_XML_9102.xml',
      fileSize: '210 KB',
      status: 'VERIFIED',
      iconType: 'address',
    },
  ]);

  // KFS Consent Checkboxes
  readonly agreeKfs = signal<boolean>(true);
  readonly agreeNach = signal<boolean>(true);
  readonly agreeCreditBureau = signal<boolean>(true);
  readonly allConsentsGiven = computed(
    () => this.agreeKfs() && this.agreeNach() && this.agreeCreditBureau(),
  );

  // OTP & Submission State
  readonly enteredOtp = signal<string>('784920');
  readonly otpCountdown = signal<number>(30);
  readonly isSubmitting = signal<boolean>(false);
  readonly sanctionResult = signal<LoanSanctionResponse | null>(null);
  readonly toastMessage = signal<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);

  private otpTimerInterval: any = null;

  // Category Filter Tabs
  readonly categoryTabs: CategoryTab[] = [
    { id: 'all', label: 'All Pre-Approved Offers', type: 'all', icon: 'sparkle' },
    { id: 'home', label: 'Home Loans', type: 'home', icon: 'home' },
    { id: 'personal', label: 'Personal Loans', type: 'personal', icon: 'user' },
    { id: 'car', label: 'Car / Auto Loans', type: 'car', icon: 'car' },
    { id: 'business', label: 'Business Loans', type: 'business', icon: 'briefcase' },
    { id: 'gold', label: 'Gold Loans', type: 'gold', icon: 'gold' },
    { id: 'education', label: 'Education Loans', type: 'education', icon: 'education' },
  ];

  // Available Disbursal Accounts
  readonly disbursalAccounts = [
    { id: 'acc_01', name: 'Primary Savings A/C •••• 0001', branch: 'Jalgaon Main Branch', balance: '₹72,000.75' },
    { id: 'acc_02', name: 'Business Current A/C •••• 0002', branch: 'Pune Camp Branch', balance: '₹3,24,460.00' },
  ];

  // Filtered Pre-Approved Offers based on active tab
  readonly filteredOffers = computed(() => {
    const cat = this.activeCategory();
    const offers = this.allOffers();
    if (cat === 'all') return offers;
    return offers.filter((o) => o.type === cat);
  });

  // Reactive live EMI and amortization breakdown
  readonly calculationResult = computed<LoanCalculationResult>(() => {
    const offer = this.selectedOffer();
    const principal = this.appliedAmount();
    const tenure = this.tenureMonths();
    const roi = offer ? offer.interestRate : 8.4;
    return this.loanService.calculateEmi(principal, roi, tenure);
  });

  ngOnInit(): void {
    // Read route query parameters to pre-select loan type if provided (e.g. /loans?type=home)
    this.route.queryParams.subscribe((params) => {
      const type = params['type'] as LoanType | undefined;
      if (type) {
        this.activeCategory.set(type);
        this.activeNavId.set(`loans-${type}`);
        this.loanService.selectOfferByType(type);
        const current = this.loanService.selectedOffer();
        this.appliedAmount.set(current.defaultAmount);
        this.amountInput.set(current.defaultAmount);
        this.tenureMonths.set(current.defaultTenureMonths);
      } else {
        this.activeCategory.set('all');
        this.activeNavId.set('loans');
        const current = this.loanService.selectedOffer();
        this.appliedAmount.set(current.defaultAmount);
        this.amountInput.set(current.defaultAmount);
        this.tenureMonths.set(current.defaultTenureMonths);
      }
    });
  }

  onNavChange(navId: string): void {
    if (navId.startsWith('loans-')) {
      const type = navId.replace('loans-', '');
      this.selectCategory(type);
    } else if (navId === 'loans') {
      this.selectCategory('all');
    } else if (navId === 'dashboard' || navId === 'my-accounts') {
      this.router.navigate(['/dashboard']);
    } else if (navId === 'profile') {
      this.router.navigate(['/profile']);
    } else if (navId === 'balance-enquiry') {
      this.router.navigate(['/balance-enquiry']);
    }
  }

  selectCategory(categoryId: string): void {
    this.activeCategory.set(categoryId);
    if (categoryId === 'all') {
      this.activeNavId.set('loans');
      this.router.navigate([], { relativeTo: this.route, queryParams: {} });
    } else {
      this.activeNavId.set(`loans-${categoryId}`);
      this.router.navigate([], { relativeTo: this.route, queryParams: { type: categoryId } });
      this.loanService.selectOfferByType(categoryId as LoanType);
      const offer = this.loanService.selectedOffer();
      this.appliedAmount.set(offer.defaultAmount);
      this.amountInput.set(offer.defaultAmount);
      this.tenureMonths.set(offer.defaultTenureMonths);
    }
  }

  /**
   * Selects an offer card and automatically scrolls down to the customizer section
   */
  selectOffer(offer: PreApprovedLoanOffer, scroll: boolean = true): void {
    this.loanService.selectOffer(offer);
    this.appliedAmount.set(offer.defaultAmount);
    this.amountInput.set(offer.defaultAmount);
    this.tenureMonths.set(offer.defaultTenureMonths);
    this.showToast('info', `Selected ${offer.title} with ROI ${offer.interestRate}% p.a.`);
    if (scroll) {
      this.scrollToCustomizer();
    }
  }

  /**
   * Smoothly scrolls the viewport to the interactive loan customizer section
   */
  scrollToCustomizer(): void {
    setTimeout(() => {
      const el = document.getElementById('loan-customizer');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 60);
  }

  onAmountSliderChange(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.appliedAmount.set(value);
    this.amountInput.set(value);
  }

  onAmountInputChange(event: Event): void {
    const rawVal = Number((event.target as HTMLInputElement).value);
    const offer = this.selectedOffer();
    if (!isNaN(rawVal)) {
      const clamped = Math.max(offer.minAmount, Math.min(offer.maxAmount, rawVal));
      this.appliedAmount.set(clamped);
      this.amountInput.set(clamped);
    }
  }

  addAmount(delta: number): void {
    const offer = this.selectedOffer();
    const current = this.appliedAmount();
    const nextVal = Math.min(offer.maxAmount, current + delta);
    this.appliedAmount.set(nextVal);
    this.amountInput.set(nextVal);
  }

  setMaxAmount(): void {
    const offer = this.selectedOffer();
    this.appliedAmount.set(offer.maxAmount);
    this.amountInput.set(offer.maxAmount);
  }

  onTenureSliderChange(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.tenureMonths.set(value);
  }

  setTenure(months: number): void {
    this.tenureMonths.set(months);
  }

  // ── Multi-Step Application Modal Workflow ──────────────────────

  openApplicationModal(): void {
    this.modalStep.set(1);
    this.sanctionResult.set(null);
    this.enteredOtp.set('784920'); // pre-filled demo code for effortless UX
    this.agreeKfs.set(true);
    this.agreeNach.set(true);
    this.agreeCreditBureau.set(true);
    this.isApplicationModalOpen.set(true);
  }

  closeApplicationModal(): void {
    this.isApplicationModalOpen.set(false);
    this.modalStep.set(1);
    if (this.otpTimerInterval) {
      clearInterval(this.otpTimerInterval);
    }
  }

  nextStep(): void {
    const current = this.modalStep();
    if (current === 1) {
      this.modalStep.set(2); // Move to Documents Upload
    } else if (current === 2) {
      this.modalStep.set(3); // Move to KFS & Consent
    } else if (current === 3) {
      if (!this.allConsentsGiven()) {
        this.showToast('error', 'Please accept all regulatory KFS terms and mandates to continue.');
        return;
      }
      this.modalStep.set(4); // Move to e-Sign OTP
      this.startOtpTimer();
    }
  }

  prevStep(): void {
    const current = this.modalStep();
    if (current > 1) {
      this.modalStep.set((current - 1) as 1 | 2 | 3 | 4 | 5);
    }
  }

  private startOtpTimer(): void {
    this.otpCountdown.set(30);
    if (this.otpTimerInterval) clearInterval(this.otpTimerInterval);
    this.otpTimerInterval = setInterval(() => {
      if (this.otpCountdown() > 0) {
        this.otpCountdown.update((c) => c - 1);
      } else {
        clearInterval(this.otpTimerInterval);
      }
    }, 1000);
  }

  resendOtp(): void {
    this.startOtpTimer();
    this.showToast('info', 'New high-security OTP sent to registered mobile +91 88840 45346');
  }

  simulateUpload(docId: string): void {
    this.showToast('info', 'Uploading and verifying document via automated OCR engine…');
    setTimeout(() => {
      this.dummyDocuments.update((docs) =>
        docs.map((d) => (d.id === docId ? { ...d, status: 'VERIFIED' } : d)),
      );
      this.showToast('success', 'Document verified successfully.');
    }, 800);
  }

  submitApplication(): void {
    this.isSubmitting.set(true);
    const offer = this.selectedOffer();
    const calc = this.calculationResult();

    this.loanService
      .submitLoanApplication({
        loanId: offer.id,
        loanType: offer.type,
        appliedAmount: this.appliedAmount(),
        tenureMonths: this.tenureMonths(),
        monthlyEmi: calc.monthlyEmi,
        interestRate: offer.interestRate,
        disbursalAccount: this.selectedDisbursalAccount(),
        customerId: 'SSPL_USER_84920',
        otpCode: this.enteredOtp(),
        agreeKfs: this.agreeKfs(),
        agreeNach: this.agreeNach(),
        agreeCreditBureau: this.agreeCreditBureau(),
        documentsVerified: true,
      })
      .subscribe({
        next: (response) => {
          this.isSubmitting.set(false);
          this.sanctionResult.set(response);
          this.modalStep.set(5); // Move to Step 5: Under Review Tracker
          this.showToast('success', 'Application submitted successfully! Currently under underwriting review.');
        },
        error: () => {
          this.isSubmitting.set(false);
          this.showToast('error', 'Loan application submission failed. Please try again.');
        },
      });
  }

  downloadKfsPdf(): void {
    this.showToast('info', 'Downloading Official Key Fact Statement (KFS.pdf)...');
  }

  formatCurrency(amount: number): string {
    return this.loanService.formatCurrency(amount);
  }

  formatCompact(amount: number): string {
    return this.loanService.formatCompactAmount(amount);
  }

  formatTenureLabel(months: number): string {
    if (months % 12 === 0) {
      const years = months / 12;
      return `${years} Year${years > 1 ? 's' : ''} (${months} Mo)`;
    }
    return `${months} Months`;
  }

  showToast(type: 'success' | 'info' | 'error', text: string): void {
    this.toastMessage.set({ type, text });
    setTimeout(() => {
      if (this.toastMessage()?.text === text) {
        this.toastMessage.set(null);
      }
    }, 4000);
  }
}
