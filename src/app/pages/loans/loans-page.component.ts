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
  LoanSanctionResponse,
  CustomLoanEnquiryPayload,
  LoanEnquiryResponse,
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

export interface CustomLoanOption {
  id: ExtendedLoanCategory;
  name: string;
  tagline: string;
  icon: string;
  indicativeRate: number;
  maxTenureYears: number;
  maxAmountLimit: number;
  defaultAmount: number;
  defaultTenureYears: number;
  samplePurposes: string[];
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

  // Dynamic Customer Profile Detail Getters
  readonly customerName = computed(() => {
    const profile = this.profileService.profile();
    if (profile?.fullName) return profile.fullName;
    if (profile?.firstName && profile?.lastName) return `${profile.firstName} ${profile.lastName}`;
    if (profile?.username) return profile.username;
    const user = this.authService.currentUser();
    if (user?.name) return user.name;
    if (user?.username) return user.username;
    return 'Valued Customer';
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

  readonly customerMobileMasked = computed(() => {
    const mob = this.profileService.profile()?.mobileNumber || '8884045346';
    const clean = mob.replace(/\D/g, '');
    const last4 = clean.length >= 4 ? clean.slice(-4) : '5346';
    return `••• ${last4}`;
  });

  readonly customerEmail = computed(() => {
    const profile = this.profileService.profile();
    if (profile?.username) {
      return `${profile.username.toLowerCase()}@ssplbank.internal`;
    }
    const authUser = this.authService.currentUser();
    if (authUser?.username) {
      return `${authUser.username.toLowerCase()}@ssplbank.internal`;
    }
    return 'customer@ssplbank.internal';
  });

  readonly customerId = computed(() => {
    return (
      this.profileService.profile()?.customerId ||
      this.authService.currentUser()?.id ||
      'SSPL-CUST-84920'
    );
  });


  // View Mode: 'pre_approved' (Default pre-approved catalog) | 'custom_enquiry' (New / Different loan requirement)
  readonly activeViewMode = signal<'pre_approved' | 'custom_enquiry'>('pre_approved');

  // Loan Offers from Service (Pre-approved)
  readonly allOffers = this.loanService.offers;
  readonly selectedOffer = this.loanService.selectedOffer;

  // Filter category state for pre-approved tab
  readonly activeCategory = signal<string>('all');

  // Slider & Customization Interactive State for pre-approved
  readonly appliedAmount = signal<number>(3500000);
  readonly tenureMonths = signal<number>(180);
  readonly amountInput = signal<number>(3500000);

  // ── Multi-Step Application Modal State ─────────────────────────
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

  // ── Custom Loan Enquiry State ──────────────────────────────────
  readonly customLoanOptions: CustomLoanOption[] = [
    {
      id: 'home',
      name: 'Home Loan',
      tagline: 'Purchase, Construction, Resale or Plot Loan',
      icon: 'home',
      indicativeRate: 8.4,
      maxTenureYears: 30,
      maxAmountLimit: 150000000,
      defaultAmount: 6500000,
      defaultTenureYears: 20,
      samplePurposes: [
        'Purchase of Under-Construction / Ready Apartment',
        'Self-Construction on Owned Residential Plot',
        'Home Renovation & Structural Extension',
        'Plot Purchase + Future Construction',
      ],
    },
    {
      id: 'lap',
      name: 'Loan Against Property (LAP)',
      tagline: 'Mortgage loan for personal or business needs',
      icon: 'building',
      indicativeRate: 9.15,
      maxTenureYears: 15,
      maxAmountLimit: 100000000,
      defaultAmount: 5000000,
      defaultTenureYears: 12,
      samplePurposes: [
        'Business Working Capital Expansion',
        'Debt Consolidation & Mortgage Refinance',
        'Higher Overseas Education Funding',
        'Commercial Real Estate Investment',
      ],
    },
    {
      id: 'personal',
      name: 'Personal Loan',
      tagline: 'Multi-purpose unsecured credit facility',
      icon: 'user',
      indicativeRate: 10.25,
      maxTenureYears: 7,
      maxAmountLimit: 4000000,
      defaultAmount: 1200000,
      defaultTenureYears: 4,
      samplePurposes: [
        'Medical Emergencies & Health Care Expenses',
        'Wedding & Family Milestone Celebrations',
        'International Travel & Vacation Funding',
        'Home Furnishing & High-Value Gadgets',
      ],
    },
    {
      id: 'business',
      name: 'Business & MSME Loan',
      tagline: 'Term loans & working capital for enterprises',
      icon: 'briefcase',
      indicativeRate: 11.5,
      maxTenureYears: 10,
      maxAmountLimit: 250000000,
      defaultAmount: 8500000,
      defaultTenureYears: 5,
      samplePurposes: [
        'Working Capital & Inventory Purchase',
        'Plant & Industrial Machinery Acquisition',
        'Business Branch & Franchise Expansion',
        'GST & Supply Chain Invoice Discounting',
      ],
    },
    {
      id: 'car',
      name: 'Car / Auto Loan',
      tagline: 'New, Pre-Owned or Electric Vehicle Finance',
      icon: 'car',
      indicativeRate: 8.75,
      maxTenureYears: 8,
      maxAmountLimit: 15000000,
      defaultAmount: 1800000,
      defaultTenureYears: 5,
      samplePurposes: [
        'Purchase of New Sedan / SUV',
        'Electric Vehicle (EV) Financing',
        'Certified Pre-Owned Luxury Car',
        'Two-Wheeler / Superbike Loan',
      ],
    },
    {
      id: 'education',
      name: 'Education Loan',
      tagline: 'Domestic & overseas higher studies',
      icon: 'education',
      indicativeRate: 8.95,
      maxTenureYears: 15,
      maxAmountLimit: 15000000,
      defaultAmount: 3500000,
      defaultTenureYears: 8,
      samplePurposes: [
        'STEM Master’s Degree in USA / UK / Europe',
        'Executive MBA / Post-Graduate in India',
        'Aviation & Commercial Pilot License Training',
        'Medical / Healthcare Degree Abroad',
      ],
    },
    {
      id: 'commercial_vehicle',
      name: 'Commercial Vehicle Loan',
      tagline: 'Trucks, Buses, Tippers & Heavy Fleet',
      icon: 'truck',
      indicativeRate: 9.5,
      maxTenureYears: 6,
      maxAmountLimit: 50000000,
      defaultAmount: 4200000,
      defaultTenureYears: 4,
      samplePurposes: [
        'Heavy Commercial Truck / Tipper Fleet',
        'Inter-City Bus & Passenger Transit',
        'Construction & Excavator Equipment',
        'Light Commercial Goods Carrier (LCV)',
      ],
    },
    {
      id: 'gold',
      name: 'Gold Loan (Overdraft)',
      tagline: 'Instant credit against 22K+ gold jewellery',
      icon: 'gold',
      indicativeRate: 8.2,
      maxTenureYears: 3,
      maxAmountLimit: 10000000,
      defaultAmount: 1500000,
      defaultTenureYears: 2,
      samplePurposes: [
        'Emergency Agricultural Working Capital',
        'Short-Term Cash Flow & Liquidity',
        'Immediate Business Inventory Booking',
        'Personal Family Contingencies',
      ],
    },
    {
      id: 'agriculture',
      name: 'Kisan & Agri Loan',
      tagline: 'Crop finance, tractors & dairy mechanization',
      icon: 'wheat',
      indicativeRate: 7.0,
      maxTenureYears: 7,
      maxAmountLimit: 5000000,
      defaultAmount: 1200000,
      defaultTenureYears: 5,
      samplePurposes: [
        'Crop Production & Seasonal Inputs (KCC)',
        'Tractor & Farm Harvester Mechanization',
        'Dairy, Poultry & Animal Husbandry Units',
        'Solar Irrigation Pump & Drip Irrigation',
      ],
    },
  ];

  // Custom Enquiry Form Fields
  readonly enquiryCategory = signal<ExtendedLoanCategory>('home');
  readonly enquiryCustomTitle = signal<string>('Home Loan (Purchase / Construction)');
  readonly enquiryPurpose = signal<string>('Purchase of Under-Construction / Ready Apartment');
  readonly enquiryAmount = signal<number>(6500000);
  readonly enquiryAmountInput = signal<number>(6500000);
  readonly enquiryTenureYears = signal<number>(20);
  readonly enquiryEmploymentType = signal<
    'SALARIED' | 'SELF_EMPLOYED_PROFESSIONAL' | 'SELF_EMPLOYED_BUSINESS' | 'NRI' | 'AGRICULTURIST'
  >('SALARIED');
  readonly enquiryMonthlyIncome = signal<number>(160000);
  readonly enquiryExistingEmi = signal<number>(15000);
  readonly enquiryPreferredBranch = signal<string>('Jalgaon Main Branch');
  readonly enquiryRemarks = signal<string>('');
  readonly enquiryApplicantName = signal<string>('');
  readonly enquiryApplicantPhone = signal<string>('');
  readonly enquiryApplicantEmail = signal<string>('');

  // Custom Enquiry Submission & Result State
  readonly isEnquiryModalOpen = signal<boolean>(false);
  readonly isSubmittingEnquiry = signal<boolean>(false);
  readonly enquiryResult = signal<LoanEnquiryResponse | null>(null);

  // Category Filter Tabs (for pre-approved view)
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

  // Reactive live EMI and amortization breakdown for pre-approved customizer
  readonly calculationResult = computed<LoanCalculationResult>(() => {
    const offer = this.selectedOffer();
    const principal = this.appliedAmount();
    const tenure = this.tenureMonths();
    const roi = offer ? offer.interestRate : 8.4;
    return this.loanService.calculateEmi(principal, roi, tenure);
  });

  // Selected Custom Option object
  readonly selectedCustomOption = computed<CustomLoanOption>(() => {
    const cat = this.enquiryCategory();
    return this.customLoanOptions.find((c) => c.id === cat) || this.customLoanOptions[0];
  });

  // Reactive live EMI for Custom Enquiry
  readonly enquiryCalculatedResult = computed<LoanCalculationResult>(() => {
    const opt = this.selectedCustomOption();
    const principal = this.enquiryAmount();
    const tenureMonths = this.enquiryTenureYears() * 12;
    return this.loanService.calculateEmi(principal, opt.indicativeRate, tenureMonths);
  });

  // FOIR & Eligibility Estimator for Custom Enquiry
  readonly maxEligibleMonthlyEmi = computed<number>(() => {
    const income = this.enquiryMonthlyIncome();
    const existing = this.enquiryExistingEmi();
    // FOIR 55% threshold
    const maxCapacity = income * 0.55;
    return Math.max(0, Math.round(maxCapacity - existing));
  });

  readonly isEmiWithinFoir = computed<boolean>(() => {
    return this.enquiryCalculatedResult().monthlyEmi <= this.maxEligibleMonthlyEmi();
  });

  ngOnInit(): void {
    // Sync profile details if already cached or fetch from customer profile API
    if (!this.profileService.profile()) {
      this.profileService.fetchProfile().subscribe(() => {
        this.syncProfileToEnquiry();
      });
    } else {
      this.syncProfileToEnquiry();
    }

    // Read route query parameters to pre-select loan type if provided (e.g. /loans?type=home)
    this.route.queryParams.subscribe((params) => {
      const type = params['type'] as LoanType | undefined;
      const mode = params['mode'] as string | undefined;

      if (mode === 'enquire' || mode === 'custom') {
        this.activeViewMode.set('custom_enquiry');
      }

      if (type) {
        this.activeCategory.set(type);
        this.activeNavId.set(`loans-${type}`);
        this.loanService.selectOfferByType(type);
        const current = this.loanService.selectedOffer();
        this.appliedAmount.set(current.defaultAmount);
        this.amountInput.set(current.defaultAmount);
        this.tenureMonths.set(current.defaultTenureMonths);

        // Also sync enquiry category
        this.onEnquiryCategorySelect(type as ExtendedLoanCategory);
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

  private syncProfileToEnquiry(): void {
    if (!this.enquiryApplicantName() || this.enquiryApplicantName() === 'Valued Customer') {
      this.enquiryApplicantName.set(this.customerName());
    }
    if (!this.enquiryApplicantPhone()) {
      this.enquiryApplicantPhone.set(this.customerMobile());
    }
    if (!this.enquiryApplicantEmail() || this.enquiryApplicantEmail() === 'customer@ssplbank.internal') {
      this.enquiryApplicantEmail.set(this.customerEmail());
    }
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

  switchViewMode(mode: 'pre_approved' | 'custom_enquiry'): void {
    this.activeViewMode.set(mode);
    if (mode === 'custom_enquiry') {
      this.showToast('info', 'Switched to Custom Loan Enquiry & Requirement Form.');
      setTimeout(() => {
        const el = document.getElementById('custom-enquiry-form');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    } else {
      this.showToast('info', 'Viewing Pre-Approved Instant Offers.');
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
      this.onEnquiryCategorySelect(categoryId as ExtendedLoanCategory);
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

  // ── Custom Enquiry Interactions ────────────────────────────────

  onEnquiryCategorySelect(cat: ExtendedLoanCategory): void {
    this.enquiryCategory.set(cat);
    const opt = this.customLoanOptions.find((c) => c.id === cat) || this.customLoanOptions[0];
    this.enquiryCustomTitle.set(opt.name);
    this.enquiryAmount.set(opt.defaultAmount);
    this.enquiryAmountInput.set(opt.defaultAmount);
    this.enquiryTenureYears.set(opt.defaultTenureYears);
    if (opt.samplePurposes.length > 0) {
      this.enquiryPurpose.set(opt.samplePurposes[0]);
    }
  }

  onEnquiryAmountChange(event: Event): void {
    const rawVal = Number((event.target as HTMLInputElement).value);
    if (!isNaN(rawVal) && rawVal > 0) {
      this.enquiryAmount.set(rawVal);
      this.enquiryAmountInput.set(rawVal);
    }
  }

  setEnquiryAmountPreset(amt: number): void {
    this.enquiryAmount.set(amt);
    this.enquiryAmountInput.set(amt);
  }

  setEnquiryTenureYears(years: number): void {
    this.enquiryTenureYears.set(years);
  }

  setEmploymentType(emp: any): void {
    this.enquiryEmploymentType.set(emp);
  }


  submitCustomLoanEnquiry(): void {

    const opt = this.selectedCustomOption();
    if (this.enquiryAmount() <= 0) {
      this.showToast('error', 'Please enter a valid loan requirement amount.');
      return;
    }

    this.isSubmittingEnquiry.set(true);

    const payload: CustomLoanEnquiryPayload = {
      loanCategory: this.enquiryCategory(),
      customLoanTitle: opt.name,
      requiredAmount: this.enquiryAmount(),
      tenureYears: this.enquiryTenureYears(),
      tenureMonths: this.enquiryTenureYears() * 12,
      loanPurpose: this.enquiryPurpose(),
      employmentType: this.enquiryEmploymentType(),
      monthlyIncome: this.enquiryMonthlyIncome(),
      existingMonthlyEmi: this.enquiryExistingEmi(),
      preferredBankCode: this.selectedBank()?.bankCode || 'JJBL',
      preferredBranch: this.enquiryPreferredBranch(),
      applicantName: this.enquiryApplicantName(),
      applicantMobile: this.enquiryApplicantPhone(),
      applicantEmail: this.enquiryApplicantEmail(),
      specialRemarks: this.enquiryRemarks(),
    };

    this.loanService.submitCustomLoanEnquiry(payload).subscribe({
      next: (response) => {
        this.isSubmittingEnquiry.set(false);
        this.enquiryResult.set(response);
        this.isEnquiryModalOpen.set(true);
        this.showToast('success', 'Custom loan enquiry registered! A dedicated loan specialist has been assigned.');
      },
      error: () => {
        this.isSubmittingEnquiry.set(false);
        this.showToast('error', 'Failed to submit loan enquiry. Please try again.');
      },
    });
  }

  closeEnquiryModal(): void {
    this.isEnquiryModalOpen.set(false);
    this.enquiryResult.set(null);
  }

  downloadEnquirySlip(): void {
    this.showToast('info', 'Downloading Official Loan Enquiry Acknowledgment Slip (PDF)...');
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
    this.showToast('info', `New high-security OTP sent to registered mobile ${this.customerMobile()}`);
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
        customerId: this.customerId(),
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
