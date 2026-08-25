import { Injectable, signal, computed } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import {
  LoanType,
  ExtendedLoanCategory,
  PreApprovedLoanOffer,
  UserBankingHealthMetrics,
  LoanCalculationResult,
  LoanApplicationPayload,
  LoanSanctionResponse,
  CustomLoanEnquiryPayload,
  LoanEnquiryResponse,
} from '../models';


@Injectable({
  providedIn: 'root',
})
export class LoanService {
  // ── Pre-approved Loan Offers Catalog ───────────────────────────
  private readonly initialOffers: PreApprovedLoanOffer[] = [
    {
      id: 'offer-home-01',
      type: 'home',
      title: 'Pre-Approved Home Loan',
      tagline: 'Turn your dream home into reality with zero processing fee & lowest ROI',
      iconName: 'home',
      badgeText: 'Lowest ROI • 8.40%',
      badgeColor: 'success',
      maxAmount: 5000000,
      minAmount: 500000,
      defaultAmount: 3500000,
      interestRate: 8.4,
      minTenureMonths: 60,
      maxTenureMonths: 240,
      defaultTenureMonths: 180,
      tenureOptions: [60, 84, 120, 180, 240],
      processingFee: '₹0 (100% Fee Waiver)',
      disbursalSpeed: 'Instant Sanction • 24-hr Disbursal',
      creditScoreRequired: 750,
      bankingHealthScore: 98,
      relationshipTier: 'Gold Customer (5+ Years)',
      eligibilityReason: 'Pre-qualified on regular salary inflow & spotless repayment record.',
      features: [
        'Zero prepayment & foreclosure charges',
        'Part-payment allowed via Net Banking anytime',
        'Direct builder disbursal facility',
        'PMAY interest subsidy eligible',
      ],
      amortizationHighlights: [
        'Tax deduction up to ₹2L on interest under Sec 24(b)',
        'Principal repayment deduction up to ₹1.5L under Sec 80C',
      ],
    },
    {
      id: 'offer-personal-01',
      type: 'personal',
      title: 'Instant Personal Loan',
      tagline: '100% digital paperless disbursement straight to your bank account',
      iconName: 'user',
      badgeText: 'Instant 10-Sec Credit',
      badgeColor: 'accent',
      maxAmount: 1000000,
      minAmount: 50000,
      defaultAmount: 400000,
      interestRate: 10.25,
      minTenureMonths: 12,
      maxTenureMonths: 60,
      defaultTenureMonths: 36,
      tenureOptions: [12, 24, 36, 48, 60],
      processingFee: '₹0 Pre-approved Offer',
      disbursalSpeed: 'Instant (10 Seconds)',
      creditScoreRequired: 720,
      bankingHealthScore: 95,
      relationshipTier: 'Verified Customer',
      eligibilityReason: 'Instant limit calculated based on average monthly account balance of ₹1.8L+.',
      features: [
        'No physical documentation required',
        'Funds credited in under 10 seconds',
        'Flexible multi-tenure duration chips',
        'Use for travel, medical, wedding, or renovation',
      ],
      amortizationHighlights: [
        'Fixed rate of interest throughout tenure',
        'Auto-debit setup with 1-click mandate',
      ],
    },
    {
      id: 'offer-car-01',
      type: 'car',
      title: 'Pre-Approved Auto / Car Loan',
      tagline: 'Drive your new car home with 100% on-road funding & zero collateral',
      iconName: 'car',
      badgeText: '100% On-Road Funding',
      badgeColor: 'info',
      maxAmount: 2000000,
      minAmount: 100000,
      defaultAmount: 1200000,
      interestRate: 8.75,
      minTenureMonths: 12,
      maxTenureMonths: 84,
      defaultTenureMonths: 60,
      tenureOptions: [12, 24, 36, 48, 60, 84],
      processingFee: 'Flat ₹999 (Special Festive Waiver)',
      disbursalSpeed: 'Express 4-Hour Approval',
      creditScoreRequired: 740,
      bankingHealthScore: 97,
      relationshipTier: 'Gold Customer',
      eligibilityReason: 'Pre-approved based on prime credit score & long-standing banking relationship.',
      features: [
        'Covers 100% on-road price including insurance & road tax',
        'Tie-ups with over 5,000 dealerships nationwide',
        'Electric Vehicle (EV) discount: Extra 0.25% ROI off',
        'No income proof required for existing customers',
      ],
      amortizationHighlights: [
        'Competitive floating or fixed interest choice',
        'Transparent fee structure with zero hidden costs',
      ],
    },
    {
      id: 'offer-business-01',
      type: 'business',
      title: 'Express Business Loan',
      tagline: 'Scale your business operations with collateral-free working capital credit',
      iconName: 'briefcase',
      badgeText: 'Collateral-Free',
      badgeColor: 'warning',
      maxAmount: 2500000,
      minAmount: 200000,
      defaultAmount: 1500000,
      interestRate: 11.5,
      minTenureMonths: 12,
      maxTenureMonths: 48,
      defaultTenureMonths: 36,
      tenureOptions: [12, 24, 36, 48],
      processingFee: '0.5% (Pre-approved concessional rate)',
      disbursalSpeed: 'Same-Day Disbursal',
      creditScoreRequired: 725,
      bankingHealthScore: 96,
      relationshipTier: 'Current A/C Partner',
      eligibilityReason: 'Pre-sanctioned based on POS/UPI merchant turnover in Current A/C •••• 0002.',
      features: [
        'Zero collateral or guarantor needed',
        'High overdraft and term loan flexibility',
        'Interest charged only on amount utilized in OD mode',
        'Quick GST/ITR automated assessment',
      ],
      amortizationHighlights: [
        'Business expense tax deductibility on interest paid',
        'Customized repayment schedule matching cash cycles',
      ],
    },
    {
      id: 'offer-gold-01',
      type: 'gold',
      title: 'Smart Gold Loan',
      tagline: 'Instant liquidity against gold jewellery with highest per-gram valuation',
      iconName: 'gold',
      badgeText: 'Lowest ROI • 8.20%',
      badgeColor: 'success',
      maxAmount: 1500000,
      minAmount: 25000,
      defaultAmount: 500000,
      interestRate: 8.2,
      minTenureMonths: 6,
      maxTenureMonths: 36,
      defaultTenureMonths: 12,
      tenureOptions: [6, 12, 18, 24, 36],
      processingFee: '₹0 (Zero Processing Fee)',
      disbursalSpeed: '15-Minute Counter Disbursal',
      creditScoreRequired: 650,
      bankingHealthScore: 92,
      relationshipTier: 'All Customers Eligible',
      eligibilityReason: 'Instant approval against certified gold collateral stored in bank vaults.',
      features: [
        'Highest per-gram valuation as per live bullion rates',
        'Insured safety in bank lockers at zero extra cost',
        'Bullet repayment option (Pay interest monthly, principal at end)',
        'Option to release partial gold upon partial repayment',
      ],
      amortizationHighlights: [
        'Choice of EMI, Bullet, or Overdraft repayment',
        'Transparent digital karat testing certificate',
      ],
    },
    {
      id: 'offer-education-01',
      type: 'education',
      title: 'Higher Education Loan',
      tagline: 'Fund domestic & global higher education with flexible moratorium repayment',
      iconName: 'education',
      badgeText: 'Moratorium Support',
      badgeColor: 'info',
      maxAmount: 4000000,
      minAmount: 100000,
      defaultAmount: 2000000,
      interestRate: 8.95,
      minTenureMonths: 36,
      maxTenureMonths: 180,
      defaultTenureMonths: 120,
      tenureOptions: [36, 60, 84, 120, 180],
      processingFee: '₹0 for Premier Institutes',
      disbursalSpeed: 'Fast-Track 48-Hour Approval',
      creditScoreRequired: 730,
      bankingHealthScore: 94,
      relationshipTier: 'Parent Co-Applicant Verified',
      eligibilityReason: 'Pre-cleared admission and parent salary account verification.',
      features: [
        'Covers 100% tuition, accommodation, books & laptop',
        'Repayment begins 12 months after course completion',
        'Tax rebate under Section 80E on full interest paid',
        'Foreign exchange and travel card bundled',
      ],
      amortizationHighlights: [
        'Simple interest charged during study moratorium',
        'No margin money required up to ₹7.5 Lakhs',
      ],
    },
  ];

  // ── Reactive Signals ───────────────────────────────────────────
  readonly offers = signal<PreApprovedLoanOffer[]>(this.initialOffers);
  readonly selectedOffer = signal<PreApprovedLoanOffer>(this.initialOffers[0]);

  // Banking Health Profile of Authenticated User
  readonly bankingHealthMetrics = signal<UserBankingHealthMetrics>({
    cibilScore: 792,
    cibilMax: 900,
    scoreCategory: 'Excellent',
    scorePercentile: 'Top 5% of borrowers in India',
    relationshipTier: 'Gold Tier Customer',
    relationshipDuration: '5+ Years with Bank',
    accountHealthScore: 98,
    cleanEmiHistory: '100% On-Time Record (36/36 EMIs)',
    bouncesCount: 0,
    preApprovedTotalLimit: 8750000,
    preApprovedOffersCount: 6,
    linkedSalaryAccount: 'Savings A/C •••• 0001',
  });

  /**
   * Calculates monthly EMI using the standard reducing balance formula:
   * E = P * r * (1+r)^n / ((1+r)^n - 1)
   */
  calculateEmi(
    principal: number,
    annualInterestRate: number,
    tenureMonths: number,
  ): LoanCalculationResult {
    if (principal <= 0 || tenureMonths <= 0) {
      return {
        monthlyEmi: 0,
        principalAmount: principal,
        totalInterest: 0,
        totalPayable: principal,
        interestPercentage: 0,
        principalPercentage: 100,
      };
    }

    const monthlyRate = annualInterestRate / 12 / 100;
    const numerator = monthlyRate * Math.pow(1 + monthlyRate, tenureMonths);
    const denominator = Math.pow(1 + monthlyRate, tenureMonths) - 1;
    const monthlyEmi = Math.round(principal * (numerator / denominator));

    const totalPayable = monthlyEmi * tenureMonths;
    const totalInterest = Math.max(0, totalPayable - principal);

    const principalPct = Math.round((principal / totalPayable) * 100);
    const interestPct = 100 - principalPct;

    return {
      monthlyEmi,
      principalAmount: principal,
      totalInterest,
      totalPayable,
      interestPercentage: interestPct,
      principalPercentage: principalPct,
    };
  }

  /**
   * Sets the active loan offer
   */
  selectOffer(offer: PreApprovedLoanOffer): void {
    this.selectedOffer.set(offer);
  }

  /**
   * Selects an offer by loan type ('home', 'personal', 'car', etc.)
   */
  selectOfferByType(type: LoanType): void {
    const found = this.offers().find((o) => o.type === type);
    if (found) {
      this.selectedOffer.set(found);
    }
  }

  /**
   * Submits loan application and returns under-review tracking details
   */
  submitLoanApplication(payload: LoanApplicationPayload): Observable<LoanSanctionResponse> {
    const sanctionNumber = `SSPL-LOAN-APP-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const applicationId = `APP-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    const now = new Date();
    const sanctionDate = now.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    const expDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    const offer = this.offers().find((o) => o.id === payload.loanId) || this.selectedOffer();

    const response: LoanSanctionResponse = {
      applicationId,
      sanctionNumber,
      status: 'UNDER_REVIEW',
      loanType: payload.loanType,
      loanTitle: offer.title,
      sanctionedAmount: payload.appliedAmount,
      tenureMonths: payload.tenureMonths,
      interestRate: payload.interestRate,
      monthlyEmi: payload.monthlyEmi,
      disbursalAccount: payload.disbursalAccount || 'A/C •••• 0001',
      sanctionDate,
      expiryDate: expDate,
      referenceCode: `KFS-${Math.random().toString(36).substring(2, 8).toUpperCase()}-2026`,
      submittedAt: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      estimatedReviewTime: 'Estimated Approval: 15 – 30 Minutes',
      trackingStages: [
        {
          title: 'Application & Documents Received',
          description: 'Personal details, income proofs & KFS consent verified digitally.',
          status: 'COMPLETED',
          timestamp: 'Just now',
        },
        {
          title: 'Automated Credit Rule Engine Evaluation',
          description: 'CIBIL 792 score and banking relationship history validated.',
          status: 'COMPLETED',
          timestamp: 'Just now',
        },
        {
          title: 'Underwriting Desk & Loan Sanction Review',
          description: 'Core banking risk team reviewing final approval mandate.',
          status: 'IN_PROGRESS',
          timestamp: 'In Progress',
        },
        {
          title: 'Disbursal & NACH Mandate Activation',
          description: 'Instant credit to selected account upon sanction signoff.',
          status: 'PENDING',
          timestamp: 'Pending review',
        },
      ],
    };

    return of(response).pipe(delay(800));
  }

  /**


   * Format numbers into Indian currency format (e.g. ₹35,00,000)
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  /**
   * Indicative Annual Percentage Rates for custom loan types
   */
  getIndicativeRate(category: ExtendedLoanCategory): number {
    const rateMap: Record<ExtendedLoanCategory, number> = {
      home: 8.4,
      personal: 10.25,
      car: 8.75,
      education: 8.95,
      business: 11.5,
      gold: 8.2,
      lap: 9.15,
      commercial_vehicle: 9.5,
      agriculture: 7.0,
    };
    return rateMap[category] || 9.0;
  }

  /**
   * Submits custom loan enquiry and assigns a specialized loan relationship officer
   */
  submitCustomLoanEnquiry(payload: CustomLoanEnquiryPayload): Observable<LoanEnquiryResponse> {
    const ticketNumber = `SSPL-ENQ-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const indicativeRoi = this.getIndicativeRate(payload.loanCategory);
    const totalMonths = payload.tenureMonths || payload.tenureYears * 12;
    const calc = this.calculateEmi(payload.requiredAmount, indicativeRoi, totalMonths);

    const officers = [
      {
        name: 'Rahul V. Sharma',
        designation: 'Senior Loan Relationship Manager',
        contactNumber: '+91 98220 54321',
        branchName: payload.preferredBranch || 'Central Lending Hub — Jalgaon Main',
      },
      {
        name: 'Priyanka S. Deshmukh',
        designation: 'Chief Underwriting & Mortgage Specialist',
        contactNumber: '+91 98231 87654',
        branchName: payload.preferredBranch || 'Retail Lending Center — Pune Camp',
      },
      {
        name: 'Amitabh Sen',
        designation: 'Commercial & MSME Lending Lead',
        contactNumber: '+91 98200 43210',
        branchName: payload.preferredBranch || 'Corporate Banking Desk — Mumbai',
      },
    ];

    const assignedOfficer = officers[Math.floor(Math.random() * officers.length)];

    const response: LoanEnquiryResponse = {
      ticketNumber,
      status: 'SUBMITTED',
      loanCategory: payload.loanCategory,
      loanTitle: payload.customLoanTitle,
      requestedAmount: payload.requiredAmount,
      tenureMonths: totalMonths,
      indicativeRoi,
      indicativeMonthlyEmi: calc.monthlyEmi,
      assignedOfficer,
      submittedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      expectedCallbackTime: 'Within 2 Hours (9:00 AM – 6:30 PM)',
    };

    return of(response).pipe(delay(700));
  }

  /**
   * Format amount into readable Lakhs / Crores (e.g. ₹35.0 L / ₹1.2 Cr)
   */
  formatCompactAmount(amount: number): string {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    }
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(amount % 100000 === 0 ? 0 : 2)} Lakhs`;
    }
    return this.formatCurrency(amount);
  }
}

