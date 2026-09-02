import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay, map, switchMap, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiRequestBuilderService } from '../core/services/api-request-builder.service';
import { ApiResponse } from '../models/api-envelope.model';
import {
  // API models
  LoanProductCode,
  LoanProduct,
  LoanProductListRequest,
  LoanProductListResponseBody,
  LoanJourneyRequest,
  LoanJourneyResponseBody,
  LoanJourneyState,
  LoanPersonalDetailsSaveRequest,
  LoanPersonalDetailsSaveResponseBody,
  LoanSectionSaveState,
  LoanQuoteRequest,
  LoanQuoteResponseBody,
  LoanQuoteCalculation,
  LoanRequirementSaveRequest,
  LoanRequirementSaveResponseBody,
  GetLoanApplicationRequest,
  GetLoanApplicationResponseBody,
  LoanApplicationDetail,
  EligibleCreditAccountsRequest,
  EligibleCreditAccountsResponseBody,
  EligibleCreditAccount,
  SubmitLoanApplicationRequest,
  SubmitLoanApplicationResponseBody,
  GetLoanApplicationStatusResponseBody,
  LoanApplicationStatusDetail,
  ListLoanApplicationsRequest,
  ListLoanApplicationsResponseBody,
  LoanApplicationSummary,
  // UI / computed models
  LoanType,
  ExtendedLoanCategory,
  PreApprovedLoanOffer,
  ActiveLoanItem,
  UserBankingHealthMetrics,
  LoanCalculationResult,
  LoanApplicationPayload,
  LoanSanctionResponse,
  CustomLoanEnquiryPayload,
  LoanEnquiryResponse,
} from '../models';
import { API_ENDPOINTS } from '../core/config/api-endpoints';

/** Base URL for the Loan Microservice gateway. Change in environment files for prod. */
// const LOAN_API_BASE = 'http://localhost:8080/TestBedGateway/API';

@Injectable({
  providedIn: 'root',
})
export class LoanService {
  private http = inject(HttpClient);
  private reqBuilder = inject(ApiRequestBuilderService);

  // ─────────────────────────────────────────────────────────────────────────
  // UI-state signals (not backed by a single API call; populated on demand)
  // ─────────────────────────────────────────────────────────────────────────

  /** Loaded via `fetchLoanProducts()`. */
  readonly products = signal<LoanProduct[]>([]);

  /** Pre-approved offer catalog (enriched from products + static UI data). */
  readonly offers = signal<PreApprovedLoanOffer[]>(this.buildInitialOffers());
  readonly selectedOffer = signal<PreApprovedLoanOffer>(this.buildInitialOffers()[1]);

  /** Active ongoing loans — hydrated from `listLoanApplications()`. */
  readonly activeLoans = signal<ActiveLoanItem[]>([]);

  /** DRAFT loan applications — available to resume. */
  readonly draftApplications = signal<LoanApplicationSummary[]>([]);

  /** True while page-level data is loading (products + application list). */
  readonly isPageLoading = signal<boolean>(true);

  /** True while a quote recalculation API call is in-flight. */
  readonly isQuoteLoading = signal<boolean>(false);

  /** Last successful quote from the backend (replaces local EMI computation). */
  readonly liveQuote = signal<LoanQuoteCalculation | null>(null);

  /** Mock application reference for a pre-existing DRAFT — drives the continue-dialog. */
  private readonly MOCK_DRAFT_REF = 'LOAN-2026-00000182';

  // ── Mock data: simulates what the backend returns for this demo customer ──
  private readonly MOCK_APPLICATIONS: LoanApplicationSummary[] = [
    {
      applicationReference: 'LOAN-2026-00000182',
      productCode: 'PERSONAL_LOAN',
      productName: 'Personal Loan',
      requestedAmount: 1400000,
      requestedTenureMonths: 36,
      estimatedEmi: 46166.41,
      applicationStatus: 'SUBMITTED',
      statusDisplayName: 'Submitted',
      currentSection: 'SUBMITTED',
      maskedCreditAccount: 'XXXXXXXX0002',
      lastUpdatedChannel: 'WEB',
      sourceChannel: 'WEB',
      createdAt: Date.now() - 2 * 60 * 60 * 1000,
      submittedAt: Date.now() - 1 * 60 * 60 * 1000,
      updatedAt: Date.now() - 45 * 60 * 1000,
    },
    {
      applicationReference: 'LOAN-2026-00000161',
      productCode: 'HOME_LOAN',
      productName: 'Home Loan',
      requestedAmount: 35000000,
      requestedTenureMonths: 84,
      estimatedEmi: 554276.99,
      applicationStatus: 'SUBMITTED',
      statusDisplayName: 'Submitted',
      currentSection: 'SUBMITTED',
      maskedCreditAccount: 'XXXXXXXX0002',
      lastUpdatedChannel: 'MOBILE',
      sourceChannel: 'MOBILE',
      createdAt: Date.now() - 8 * 60 * 60 * 1000,
      submittedAt: Date.now() - 7 * 60 * 60 * 1000,
      updatedAt: Date.now() - 7 * 60 * 60 * 1000,
    },
    {
      applicationReference: 'LOAN-2026-00000141',
      productCode: 'BUSINESS_LOAN',
      productName: 'Business Loan',
      requestedAmount: 1500000,
      requestedTenureMonths: 36,
      estimatedEmi: 49821.46,
      applicationStatus: 'SUBMITTED',
      statusDisplayName: 'Submitted',
      currentSection: 'SUBMITTED',
      maskedCreditAccount: 'XXXXXXXX0002',
      lastUpdatedChannel: 'WEB',
      sourceChannel: 'WEB',
      createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
      submittedAt: Date.now() - 5 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000,
      updatedAt: Date.now() - 5 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000,
    },
  ];

  /** Banking health profile of the authenticated user (static/enriched). */
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
    preApprovedOffersCount: 4,
    linkedSalaryAccount: 'Savings A/C •••• 0001',
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 1. GET /banking/loan/product/list
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Fetches available loan products from the server.
   * Populates `this.products` signal and rebuilds `this.offers` from real data.
   */
  fetchLoanProducts(): Observable<LoanProduct[]> {
    const req = this.reqBuilder.buildRequest<LoanProductListRequest>({});
    return this.http
      .post<ApiResponse<LoanProductListResponseBody>>(API_ENDPOINTS.BANKING.LOAN_PRODUCTS, req)
      .pipe(
        map((res) => {
          const prods = res.body?.loanProductListResponse?.products ?? [];
          if (prods.length > 0) {
            this.products.set(prods);
            this.offers.set(this.enrichProductsToOffers(prods));
            if (this.offers().length > 0) {
              this.selectedOffer.set(this.offers()[0]);
            }
          }
          return prods;
        }),
        catchError(() => {
          const initialOffers = this.buildInitialOffers();
          const fallbackProds: LoanProduct[] = initialOffers.map((o) => ({
            productCode: o.productCode,
            productName: o.title,
            productDescription: o.tagline,
            lobCode: 'RETAIL' as const,
            minimumAmount: o.minAmount,
            maximumAmount: o.maxAmount,
            indicativeInterestRate: o.interestRate,
            minimumTenureMonths: o.minTenureMonths,
            maximumTenureMonths: o.maxTenureMonths,
          }));
          this.products.set(fallbackProds);
          this.offers.set(initialOffers);
          return of(fallbackProds);
        }),
      );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 2. POST /banking/loan/journey
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Initialises or resumes a loan journey for the given product code.
   * Returns the current section state so the UI wizard knows where to start.
   */
  initLoanJourney(productCode: LoanProductCode): Observable<LoanJourneyState> {
    const req = this.reqBuilder.buildRequest<LoanJourneyRequest>({
      loanJourneyRequest: { productCode },
    });
    const mockJourney: LoanJourneyState = {
      requestedProductCode: productCode,
      productMismatch: false,
      applicationAlreadyExists: false,
      currentSection: 'PERSONAL_DETAILS',
      applicationProductCode: null,
      applicationProductName: null,
      applicationStatus: null,
      applicationReference: null,
      lastCompletedSection: null,
      lastUpdatedChannel: null,
      sourceChannel: null,
      updatedAt: null,
    };
    return this.http
      .post<ApiResponse<LoanJourneyResponseBody>>(API_ENDPOINTS.BANKING.LOAN_JOURNEY, req)
      .pipe(
        map((res) => res.body!.loanJourneyResponse),
        catchError(() => of(mockJourney).pipe(delay(600))),
      );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 3. POST /banking/save/loan/personaldetails
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Saves the personal details section of a loan application.
   * Pass `applicationReference: null` for a brand-new application.
   */
  saveLoanPersonalDetails(
    details: LoanPersonalDetailsSaveRequest['loanPersonalDetailsSaveRequest'],
  ): Observable<LoanSectionSaveState> {
    const payload: LoanPersonalDetailsSaveRequest['loanPersonalDetailsSaveRequest'] = {
      ...details,
      applicationReference: details.applicationReference ?? null,
    };
    const req = this.reqBuilder.buildRequest<LoanPersonalDetailsSaveRequest>({
      loanPersonalDetailsSaveRequest: payload,
    });
    const mockSaveState: LoanSectionSaveState = {
      savedSection: 'PERSONAL_DETAILS',
      nextSection: 'LOAN_REQUIREMENT',
      applicationReference: payload.applicationReference ?? 'LOAN-2026-00000182',
      applicationStatus: 'DRAFT',
      lastUpdatedChannel: 'WEB',
      sourceChannel: 'WEB',
      updatedAt: 1788167310214,
    };
    return this.http
      .post<ApiResponse<LoanPersonalDetailsSaveResponseBody>>(API_ENDPOINTS.BANKING.SAVE_DETAILS, req)
      .pipe(
        map((res) => {
          if (res.header?.status === 'error' || !res.body?.loanSectionSaveResponse) {
            throw new Error(res.header?.errorMessage || 'Failed to save personal details');
          }
          return res.body.loanSectionSaveResponse;
        }),
        catchError((err) => {
          if (environment.useMockApi) {
            return of(mockSaveState).pipe(delay(700));
          }
          return throwError(() => err);
        }),
      );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 4. POST /banking/calculate/loan/quote
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Calculates an indicative loan quote (EMI, processing fee, facility amount).
   */
  calculateLoanQuote(
    payload: LoanQuoteRequest['loanQuoteRequest'],
  ): Observable<LoanQuoteCalculation> {
    const req = this.reqBuilder.buildRequest<LoanQuoteRequest>({
      loanQuoteRequest: payload,
    });
    // Mock calculation matching real backend formula with simulated API latency
    const r = this.getProductRate(payload.productCode) / 12 / 100;
    const n = payload.requestedTenureMonths;
    const P = payload.requestedAmount;
    const pow = Math.pow(1 + r, n);
    const emi = P > 0 && n > 0 ? Math.round(((P * (r * pow)) / (pow - 1)) * 100) / 100 : 0;
    const processingFee = Math.round(P * 0.01);
    const finalFacility = P - processingFee;
    const mockQuote: LoanQuoteCalculation = {
      quoteReference: `QUOTE-${Date.now().toString().slice(-10)}`,
      productCode: payload.productCode,
      productName: this.productCodeToName(payload.productCode),
      requestedAmount: P,
      finalFacilityAmount: finalFacility,
      processingFee,
      indicativeInterestRate: r * 12 * 100,
      requestedTenureMonths: n,
      estimatedEmi: emi,
      quoteValidUntil: Date.now() + 30 * 60 * 1000,
    };
    return this.http
      .post<ApiResponse<LoanQuoteResponseBody>>(API_ENDPOINTS.BANKING.LOAN_QUOTE, req)
      .pipe(
        map((res) => {
          if (res.header?.status === 'error' || !res.body?.loanQuoteCalculationResponse) {
            throw new Error(res.header?.errorMessage || 'Failed to calculate quote');
          }
          return res.body.loanQuoteCalculationResponse;
        }),
        catchError((err) => {
          if (environment.useMockApi) {
            return of(mockQuote).pipe(delay(700));
          }
          return throwError(() => err);
        }),
      );
  }

  /**
   * Convenience wrapper: triggers isQuoteLoading, calls calculateLoanQuote,
   * updates liveQuote signal. Used by the UI for real-time slider recalculation.
   */
  recalculateQuote(
    applicationReference: string,
    productCode: LoanProductCode,
    requestedAmount: number,
    requestedTenureMonths: number,
  ): Observable<LoanQuoteCalculation> {
    this.isQuoteLoading.set(true);
    return this.calculateLoanQuote({
      applicationReference,
      productCode,
      requestedAmount,
      requestedTenureMonths,
    }).pipe(
      map((quote) => {
        this.liveQuote.set(quote);
        this.isQuoteLoading.set(false);
        return quote;
      }),
      catchError((err) => {
        this.isQuoteLoading.set(false);
        console.error('[LoanService] calculateLoanQuote failed:', err);
        return throwError(() => err);
      }),
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 5. POST /banking/save/loan/requirement
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Saves the loan requirement section (amount, tenure, purpose, quote reference).
   */
  saveLoanRequirement(
    payload: LoanRequirementSaveRequest['loanRequirementSaveRequest'],
  ): Observable<LoanSectionSaveState> {
    const req = this.reqBuilder.buildRequest<LoanRequirementSaveRequest>({
      loanRequirementSaveRequest: payload,
    });
    const mockSaveState: LoanSectionSaveState = {
      savedSection: 'LOAN_REQUIREMENT',
      nextSection: 'REVIEW',
      applicationReference: payload.applicationReference,
      applicationStatus: 'DRAFT',
      lastUpdatedChannel: 'WEB',
      sourceChannel: 'WEB',
      updatedAt: 1788167787872,
    };
    return this.http
      .post<ApiResponse<LoanRequirementSaveResponseBody>>(API_ENDPOINTS.BANKING.SAVE_LOAN, req)
      .pipe(
        map((res) => {
          if (res.header?.status === 'error' || !res.body?.loanSectionSaveResponse) {
            throw new Error(res.header?.errorMessage || 'Failed to save loan requirement');
          }
          return res.body.loanSectionSaveResponse;
        }),
        catchError((err) => {
          if (environment.useMockApi) {
            return of(mockSaveState).pipe(delay(700));
          }
          return throwError(() => err);
        }),
      );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 6. POST /banking/get/loan/application
  // ─────────────────────────────────────────────────────────────────────────

  getLoanApplication(applicationReference: string): Observable<LoanApplicationDetail> {
    const req = this.reqBuilder.buildRequest<GetLoanApplicationRequest>({
      loanApplicationRequest: { applicationReference },
    });
    return this.http
      .post<ApiResponse<GetLoanApplicationResponseBody>>(API_ENDPOINTS.BANKING.GET_LOAN_APPLICATION, req)
      .pipe(
        map((res) => {
          if (res.header?.status === 'error' || !res.body?.loanApplicationResponse) {
            throw new Error(res.header?.errorMessage || 'Failed to get loan application');
          }
          return res.body.loanApplicationResponse;
        }),
        catchError((err) => {
          if (environment.useMockApi) {
            const fallback: LoanApplicationDetail = {
              applicationReference,
              applicationStatus: 'DRAFT',
              currentSection: 'REVIEW',
              lastCompletedSection: 'LOAN_REQUIREMENT',
              lastUpdatedChannel: 'WEB',
              sourceChannel: 'WEB',
              personalDetails: {
                fullName: '',
                mobileNumber: '',
                fatherName: '',
                emailId: '',
                addressLine: '',
                postalCode: '',
                dateOfBirth: '',
              },
              loanRequirement: {
                productCode: 'PERSONAL_LOAN',
                requestedAmount: 1400000,
                requestedTenureMonths: 36,
                loanPurpose: 'Personal requirement',
              },
              loanQuote: {
                quoteReference: `QUOTE-${Date.now()}`,
                finalFacilityAmount: 1386000,
                processingFee: 14000,
                indicativeInterestRate: 11.5,
                estimatedEmi: 46182,
                quoteValidUntil: Date.now() + 1800000,
              },
              createdAt: Date.now() - 3600000,
              updatedAt: Date.now(),
            };
            return of(fallback).pipe(delay(500));
          }
          return throwError(() => err);
        }),
      );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 7. POST /banking/list/eligible/credit/accounts
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Returns the list of customer's accounts that are eligible for loan credit.
   */
  listEligibleCreditAccounts(): Observable<EligibleCreditAccount[]> {
    const req = this.reqBuilder.buildRequest<EligibleCreditAccountsRequest>({});
    return this.http
      .post<
        ApiResponse<EligibleCreditAccountsResponseBody>
      >(API_ENDPOINTS.BANKING.BANK_ACCOUNTS, req)
      .pipe(map((res) => res.body?.eligibleCreditAccountListResponse?.accounts ?? []));
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 8. POST /banking/submit/loan/application
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Submits a completed loan application for processing.
   */
  submitLoanApplicationDirect(
    payload: SubmitLoanApplicationRequest['loanApplicationSubmitRequest'],
  ): Observable<LoanSanctionResponse> {
    const req = this.reqBuilder.buildRequest<SubmitLoanApplicationRequest>({
      loanApplicationSubmitRequest: payload,
    });
    return this.http
      .post<ApiResponse<SubmitLoanApplicationResponseBody>>(API_ENDPOINTS.BANKING.SUBMIT_LOAN, req)
      .pipe(
        map((res) => {
          const s = res.body!.loanApplicationSubmitResponse;
          // Build a UI-facing sanction response (quote details come from the caller's context)
          return {
            applicationReference: s.applicationReference,
            applicationStatus: s.applicationStatus,
            submittedChannel: s.submittedChannel,
            maskedCreditAccount: s.maskedCreditAccount,
            creditAccountReference: s.creditAccountReference,
            submittedAt: s.submittedAt,
            // These are filled by the orchestrated flow below
            finalFacilityAmount: 0,
            indicativeInterestRate: 0,
            estimatedEmi: 0,
            processingFee: 0,
            quoteReference: '',
            productName: '',
            requestedTenureMonths: 0,
          } satisfies LoanSanctionResponse;
        }),
      );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 9. POST /banking/get/loan/application/status
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Polls the status of a submitted loan application.
   */
  getLoanApplicationStatus(applicationReference: string): Observable<LoanApplicationStatusDetail> {
    const req = this.reqBuilder.buildRequest<GetLoanApplicationRequest>({
      loanApplicationRequest: { applicationReference },
    });
    return this.http
      .post<
        ApiResponse<GetLoanApplicationStatusResponseBody>
      >(API_ENDPOINTS.BANKING.LOAN_APP_STATUS, req)
      .pipe(map((res) => res.body!.loanApplicationStatusResponse));
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 10. POST /banking/list/loan/applications
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Lists all loan applications for the authenticated customer.
   * Also hydrates the `activeLoans` signal from SUBMITTED applications.
   */
  listLoanApplications(): Observable<LoanApplicationSummary[]> {
    const req = this.reqBuilder.buildRequest<ListLoanApplicationsRequest>({});
    const mockResponse = of(this.MOCK_APPLICATIONS).pipe(
      delay(900),
      map((apps) => {
        this.draftApplications.set(apps.filter((a) => a.applicationStatus === 'DRAFT'));
        const activeItems: ActiveLoanItem[] = apps
          .filter((a) => a.applicationStatus === 'SUBMITTED')
          .map((a) => this.applicationSummaryToActiveLoan(a));
        this.activeLoans.set(activeItems);
        this.isPageLoading.set(false);
        return apps;
      }),
    );
    return this.http
      .post<ApiResponse<ListLoanApplicationsResponseBody>>(API_ENDPOINTS.BANKING.LOAN_APP_LIST, req)
      .pipe(
        map((res) => {
          const apps = res.body?.loanApplicationListResponse?.applications ?? [];
          this.draftApplications.set(apps.filter((a) => a.applicationStatus === 'DRAFT'));
          const activeItems: ActiveLoanItem[] = apps
            .filter((a) => a.applicationStatus === 'SUBMITTED')
            .map((a) => this.applicationSummaryToActiveLoan(a));
          this.activeLoans.set(activeItems);
          this.isPageLoading.set(false);
          return apps;
        }),
        catchError(() => mockResponse),
      );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Orchestrated Multi-Step Loan Application Flow (used by the UI wizard)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Full wizard orchestration — DEMO MOCK:
   * Simulates the complete 5-step flow (journey → personalDetails → quote →
   * requirement → submit) as a single fake delay, without calling any real APIs.
   * When the backend is ready, swap the `of(mockResult)` body back to the
   * real switchMap chain below.
   *
   * Returns a `LoanSanctionResponse` with quote details merged in.
   */
  submitLoanApplication(payload: LoanApplicationPayload): Observable<LoanSanctionResponse> {
    // Compute realistic EMI values locally (same formula as calculateLoanQuote mock)
    const r = this.getProductRate(payload.productCode) / 12 / 100;
    const n = payload.requestedTenureMonths;
    const P = payload.requestedAmount;
    const pow = Math.pow(1 + r, n);
    const emi = P > 0 && n > 0 ? Math.round(((P * (r * pow)) / (pow - 1)) * 100) / 100 : 0;
    const processingFee = Math.round(P * 0.01);
    const quoteRef = `QUOTE-${Date.now().toString().slice(-10)}`;
    const appRef = `LOAN-${new Date().getFullYear()}-${Math.floor(10000000 + Math.random() * 89999999)}`;

    const mockResult: LoanSanctionResponse = {
      applicationReference: appRef,
      applicationStatus: 'SUBMITTED',
      submittedChannel: 'WEB',
      maskedCreditAccount: 'XXXXXXXX4521',
      creditAccountReference: payload.creditAccountReference,
      submittedAt: Date.now(),
      // Quote details
      finalFacilityAmount: P - processingFee,
      indicativeInterestRate: this.getProductRate(payload.productCode),
      estimatedEmi: emi,
      processingFee,
      quoteReference: quoteRef,
      productName: this.productCodeToName(payload.productCode),
      requestedTenureMonths: n,
    };

    // Simulate realistic multi-step processing time (≈ 2.2 s total)
    return of(mockResult).pipe(delay(2200));
  }

  /* ── Real multi-step orchestration (restore when backend is live) ──────────
  submitLoanApplication(payload: LoanApplicationPayload): Observable<LoanSanctionResponse> {
    return this.initLoanJourney(payload.productCode).pipe(
      switchMap((journey) =>
        this.saveLoanPersonalDetails({
          applicationReference: journey.applicationReference ?? payload.applicationReference,
          productCode: payload.productCode,
          fullName: payload.fullName,
          mobileNumber: payload.mobileNumber,
          fatherName: payload.fatherName,
          emailId: payload.emailId,
          addressLine: payload.addressLine,
          postalCode: payload.postalCode,
          dateOfBirth: payload.dateOfBirth,
        }),
      ),
      switchMap((saved) =>
        this.calculateLoanQuote({
          applicationReference: saved.applicationReference,
          productCode: payload.productCode,
          requestedAmount: payload.requestedAmount,
          requestedTenureMonths: payload.requestedTenureMonths,
        }),
      ),
      switchMap((quote) =>
        this.saveLoanRequirement({
          applicationReference: quote.quoteReference.replace('QUOTE', 'LOAN'),
          quoteReference: quote.quoteReference,
          productCode: payload.productCode,
          requestedAmount: payload.requestedAmount,
          requestedTenureMonths: payload.requestedTenureMonths,
          loanPurpose: payload.loanPurpose,
        }).pipe(map((saved) => ({ saved, quote }))),
      ),
      switchMap(({ saved, quote }) =>
        this.submitLoanApplicationDirect({
          applicationReference: saved.applicationReference,
          creditAccountReference: payload.creditAccountReference,
          communicationEmail: payload.communicationEmail,
          termsAccepted: payload.termsAccepted,
          termsVersion: payload.termsVersion,
        }).pipe(
          map((sanction) => ({
            ...sanction,
            finalFacilityAmount: quote.finalFacilityAmount,
            indicativeInterestRate: quote.indicativeInterestRate,
            estimatedEmi: quote.estimatedEmi,
            processingFee: quote.processingFee,
            quoteReference: quote.quoteReference,
            productName: quote.productName,
            requestedTenureMonths: quote.requestedTenureMonths,
          })),
        ),
      ),
    );
  }
  ─────────────────────────────────────────────────────────────────────────── */

  // ─────────────────────────────────────────────────────────────────────────
  // UI utility methods
  // ─────────────────────────────────────────────────────────────────────────

  selectOffer(offer: PreApprovedLoanOffer): void {
    this.selectedOffer.set(offer);
  }

  selectOfferByType(type: LoanType): void {
    const found = this.offers().find((o) => o.type === type);
    if (found) this.selectedOffer.set(found);
  }

  /**
   * Calculates monthly EMI using the standard reducing balance formula.
   * E = P × r × (1+r)^n / ((1+r)^n − 1)
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
    const r = annualInterestRate / 12 / 100;
    const pow = Math.pow(1 + r, tenureMonths);
    const emi = Math.round((principal * (r * pow)) / (pow - 1));
    const total = emi * tenureMonths;
    const interest = Math.max(0, total - principal);
    const principalPct = Math.round((principal / total) * 100);
    return {
      monthlyEmi: emi,
      principalAmount: principal,
      totalInterest: interest,
      totalPayable: total,
      interestPercentage: 100 - principalPct,
      principalPercentage: principalPct,
    };
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  formatCompactAmount(amount: number): string {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
    if (amount >= 100000)
      return `₹${(amount / 100000).toFixed(amount % 100000 === 0 ? 0 : 2)} Lakhs`;
    return this.formatCurrency(amount);
  }

  getIndicativeRate(category: ExtendedLoanCategory): number {
    const map: Record<ExtendedLoanCategory, number> = {
      home: 8.5,
      personal: 11.5,
      car: 9.25,
      education: 8.95,
      business: 12.0,
      gold: 8.2,
      lap: 9.15,
      commercial_vehicle: 9.5,
      agriculture: 7.0,
    };
    return map[category] ?? 9.0;
  }

  /** Returns the indicative annual interest rate for a product code. */
  private getProductRate(code: LoanProductCode): number {
    const map: Record<LoanProductCode, number> = {
      PERSONAL_LOAN: 11.5,
      HOME_LOAN: 8.5,
      VEHICLE_LOAN: 9.25,
      BUSINESS_LOAN: 12.0,
    };
    return map[code] ?? 10.0;
  }

  private productCodeToName(code: LoanProductCode): string {
    const map: Record<LoanProductCode, string> = {
      PERSONAL_LOAN: 'Personal Loan',
      HOME_LOAN: 'Home Loan',
      VEHICLE_LOAN: 'Vehicle Loan',
      BUSINESS_LOAN: 'Business Loan',
    };
    return map[code] ?? code;
  }

  /**
   * Custom loan enquiry flow (non-banking-MS, internal ticket system).
   */
  submitCustomLoanEnquiry(payload: CustomLoanEnquiryPayload): Observable<LoanEnquiryResponse> {
    const ticketNumber = `SSPL-ENQ-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const roi = this.getIndicativeRate(payload.loanCategory);
    const months = payload.tenureMonths || payload.tenureYears * 12;
    const calc = this.calculateEmi(payload.requiredAmount, roi, months);
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
    const response: LoanEnquiryResponse = {
      ticketNumber,
      status: 'SUBMITTED',
      loanCategory: payload.loanCategory,
      loanTitle: payload.customLoanTitle,
      requestedAmount: payload.requiredAmount,
      tenureMonths: months,
      indicativeRoi: roi,
      indicativeMonthlyEmi: calc.monthlyEmi,
      assignedOfficer: officers[Math.floor(Math.random() * officers.length)],
      submittedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      expectedCallbackTime: 'Within 2 Hours (9:00 AM – 6:30 PM)',
    };
    return of(response).pipe(delay(700));
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Private helpers
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Converts real LoanProduct list from API into enriched PreApprovedLoanOffer view models.
   */
  private enrichProductsToOffers(products: LoanProduct[]): PreApprovedLoanOffer[] {
    return products.map((p) => this.productToOffer(p));
  }

  private productToOffer(p: LoanProduct): PreApprovedLoanOffer {
    const type = this.productCodeToType(p.productCode);
    const uiMeta = this.getOfferUiMeta(p.productCode);
    const tenureOptions = this.buildTenureOptions(
      p.minimumTenureMonths,
      p.maximumTenureMonths,
      p.productCode,
    );
    const defaultTenure =
      tenureOptions[Math.floor(tenureOptions.length / 2)] || p.minimumTenureMonths;
    return {
      id: `offer-${p.productCode.toLowerCase()}`,
      type,
      productCode: p.productCode,
      title: p.productName,
      tagline: p.productDescription,
      iconName: type,
      badgeText: uiMeta.badge,
      badgeColor: uiMeta.badgeColor,
      maxAmount: p.maximumAmount,
      minAmount: p.minimumAmount,
      defaultAmount: Math.min(
        Math.max(Math.round(p.maximumAmount * 0.4), p.minimumAmount),
        p.maximumAmount,
      ),
      interestRate: p.indicativeInterestRate,
      minTenureMonths: p.minimumTenureMonths,
      maxTenureMonths: p.maximumTenureMonths,
      defaultTenureMonths: defaultTenure,
      tenureOptions,
      processingFee: uiMeta.processingFee,
      disbursalSpeed: uiMeta.disbursalSpeed,
      creditScoreRequired: uiMeta.creditScoreRequired,
      bankingHealthScore: uiMeta.bankingHealthScore,
      relationshipTier: uiMeta.relationshipTier,
      eligibilityReason: uiMeta.eligibilityReason,
      features: uiMeta.features,
      amortizationHighlights: uiMeta.amortizationHighlights,
    };
  }

  private productCodeToType(code: LoanProductCode): LoanType {
    const map: Record<LoanProductCode, LoanType> = {
      PERSONAL_LOAN: 'personal',
      HOME_LOAN: 'home',
      VEHICLE_LOAN: 'car',
      BUSINESS_LOAN: 'business',
    };
    return map[code] ?? 'personal';
  }

  /**
   * Generates dynamic tenure chip options (in months) based on minimumTenureMonths
   * and maximumTenureMonths for a given productCode.
   *
   * Examples:
   * - PERSONAL_LOAN (6 to 60): [6, 12, 24, 36, 48, 60]
   * - HOME_LOAN (60 to 360): [60, 120, 180, 240, 300, 360] (5Y, 10Y, 15Y, 20Y, 25Y, 30Y)
   * - VEHICLE_LOAN (12 to 84): [12, 24, 36, 48, 60, 72, 84] (1Y to 7Y)
   * - BUSINESS_LOAN (12 to 120): [12, 24, 36, 48, 60, 84, 120] (1Y to 10Y)
   */
  buildTenureOptions(min: number, max: number, productCode?: LoanProductCode): number[] {
    if (!min || !max || min > max) {
      return [12, 24, 36, 48, 60];
    }

    if (productCode === 'HOME_LOAN') {
      // Home loan: standard 5-year slabs (60, 120, 180, 240, 300, 360 months)
      const homeSteps = [60, 120, 180, 240, 300, 360];
      const filtered = homeSteps.filter((m) => m >= min && m <= max);
      const set = new Set([min, ...filtered, max]);
      return Array.from(set).sort((a, b) => a - b);
    }

    if (productCode === 'PERSONAL_LOAN') {
      // Personal loan: 6, 12, 24, 36, 48, 60 months
      const personalSteps = [6, 12, 24, 36, 48, 60];
      const filtered = personalSteps.filter((m) => m >= min && m <= max);
      const set = new Set([min, ...filtered, max]);
      return Array.from(set).sort((a, b) => a - b);
    }

    if (productCode === 'VEHICLE_LOAN') {
      // Vehicle loan: yearly options (12, 24, 36, 48, 60, 72, 84 months)
      const autoSteps = [12, 24, 36, 48, 60, 72, 84];
      const filtered = autoSteps.filter((m) => m >= min && m <= max);
      const set = new Set([min, ...filtered, max]);
      return Array.from(set).sort((a, b) => a - b);
    }

    if (productCode === 'BUSINESS_LOAN') {
      // Business loan: 12, 24, 36, 48, 60, 84, 120 months
      const bizSteps = [12, 24, 36, 48, 60, 84, 120];
      const filtered = bizSteps.filter((m) => m >= min && m <= max);
      const set = new Set([min, ...filtered, max]);
      return Array.from(set).sort((a, b) => a - b);
    }

    // Generic fallback for any other product:
    const candidateSteps = [6, 12, 18, 24, 36, 48, 60, 72, 84, 96, 120, 180, 240, 300, 360];
    const filtered = candidateSteps.filter((m) => m >= min && m <= max);
    const set = new Set([min, ...filtered, max]);
    return Array.from(set).sort((a, b) => a - b);
  }

  private getOfferUiMeta(code: LoanProductCode): {
    badge: string;
    badgeColor: PreApprovedLoanOffer['badgeColor'];
    processingFee: string;
    disbursalSpeed: string;
    creditScoreRequired: number;
    bankingHealthScore: number;
    relationshipTier: string;
    eligibilityReason: string;
    features: string[];
    amortizationHighlights: string[];
  } {
    const meta: Record<LoanProductCode, ReturnType<typeof this.getOfferUiMeta>> = {
      PERSONAL_LOAN: {
        badge: 'Instant 10-Sec Credit',
        badgeColor: 'accent',
        processingFee: '₹0 Pre-approved Offer',
        disbursalSpeed: 'Instant (10 Seconds)',
        creditScoreRequired: 720,
        bankingHealthScore: 95,
        relationshipTier: 'Verified Customer',
        eligibilityReason: 'Instant limit calculated based on average monthly account balance.',
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
      HOME_LOAN: {
        badge: 'Lowest ROI • 8.50%',
        badgeColor: 'success',
        processingFee: '₹0 (100% Fee Waiver)',
        disbursalSpeed: 'Instant Sanction • 24-hr Disbursal',
        creditScoreRequired: 750,
        bankingHealthScore: 98,
        relationshipTier: 'Gold Customer (5+ Years)',
        eligibilityReason: 'Pre-qualified on regular salary inflow & spotless repayment record.',
        features: [
          'Zero prepayment & foreclosure charges',
          'Direct builder disbursal facility',
          'PMAY interest subsidy eligible',
        ],
        amortizationHighlights: [
          'Tax deduction up to ₹2L on interest under Sec 24(b)',
          'Principal repayment deduction up to ₹1.5L under Sec 80C',
        ],
      },
      VEHICLE_LOAN: {
        badge: '100% On-Road Funding',
        badgeColor: 'info',
        processingFee: 'Flat ₹999 (Special Festive Waiver)',
        disbursalSpeed: 'Express 4-Hour Approval',
        creditScoreRequired: 740,
        bankingHealthScore: 97,
        relationshipTier: 'Gold Customer',
        eligibilityReason:
          'Pre-approved based on prime credit score & long-standing banking relationship.',
        features: [
          'Covers 100% on-road price including insurance & road tax',
          'Tie-ups with over 5,000 dealerships nationwide',
          'Electric Vehicle (EV) discount: Extra 0.25% ROI off',
        ],
        amortizationHighlights: [
          'Competitive floating or fixed interest choice',
          'Transparent fee structure with zero hidden costs',
        ],
      },
      BUSINESS_LOAN: {
        badge: 'Collateral-Free',
        badgeColor: 'warning',
        processingFee: '0.5% (Pre-approved concessional rate)',
        disbursalSpeed: 'Same-Day Disbursal',
        creditScoreRequired: 725,
        bankingHealthScore: 96,
        relationshipTier: 'Current A/C Partner',
        eligibilityReason: 'Pre-sanctioned based on POS/UPI merchant turnover in Current A/C.',
        features: [
          'Zero collateral or guarantor needed',
          'High overdraft and term loan flexibility',
          'Quick GST/ITR automated assessment',
        ],
        amortizationHighlights: [
          'Business expense tax deductibility on interest paid',
          'Customized repayment schedule matching cash cycles',
        ],
      },
    };
    return meta[code];
  }

  /**
   * Converts a LoanApplicationSummary to an ActiveLoanItem view model.
   */
  private applicationSummaryToActiveLoan(app: LoanApplicationSummary): ActiveLoanItem {
    const type = this.productCodeToType(app.productCode);
    const tenureMonths = app.requestedTenureMonths;
    // Approximate: assume equidistant progress based on submission date and today
    const ageMs = Date.now() - app.createdAt;
    const ageMonths = Math.floor(ageMs / (30 * 24 * 60 * 60 * 1000));
    const emisPaid = Math.min(ageMonths, tenureMonths);
    const emisRemaining = tenureMonths - emisPaid;
    const paidPrincipal = Math.round((emisPaid / tenureMonths) * app.requestedAmount);
    const remainingPrincipal = app.requestedAmount - paidPrincipal;
    const progress = Math.round((paidPrincipal / app.requestedAmount) * 100);

    return {
      id: app.applicationReference,
      accountNumber: app.applicationReference,
      loanType: type,
      title: app.productName,
      sanctionedAmount: app.requestedAmount,
      remainingPrincipal,
      paidPrincipal,
      currentAdjustedRoi: 0, // Not in summary; would come from detailed status API
      benchmarkDetails: 'See full application for rate details',
      monthlyEmi: app.estimatedEmi,
      nextEmiDate: this.nextEmiDate(),
      nextEmiAmount: app.estimatedEmi,
      tenureMonths,
      emisPaid,
      emisRemaining,
      disbursalDate: new Date(app.createdAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      disbursalAccount: app.maskedCreditAccount,
      status: 'ACTIVE',
      progressPercentage: progress,
    };
  }

  private nextEmiDate(): string {
    const today = new Date();
    const next = new Date(today.getFullYear(), today.getMonth() + 1, 8);
    return next.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  /**
   * Builds the initial pre-approved offers catalog using static UI data
   * (used until `fetchLoanProducts()` is called and replaces with real API data).
   */
  private buildInitialOffers(): PreApprovedLoanOffer[] {
    const staticProducts: LoanProduct[] = [
      {
        productCode: 'PERSONAL_LOAN',
        productName: 'Personal Loan',
        productDescription: 'Personal loan for eligible retail customers',
        lobCode: 'RETAIL',
        minimumAmount: 25000,
        maximumAmount: 2500000,
        indicativeInterestRate: 11.5,
        minimumTenureMonths: 6,
        maximumTenureMonths: 60,
      },
      {
        productCode: 'HOME_LOAN',
        productName: 'Home Loan',
        productDescription: 'Housing finance for eligible retail customers',
        lobCode: 'RETAIL',
        minimumAmount: 500000,
        maximumAmount: 50000000,
        indicativeInterestRate: 8.5,
        minimumTenureMonths: 60,
        maximumTenureMonths: 360,
      },
      {
        productCode: 'VEHICLE_LOAN',
        productName: 'Vehicle Loan',
        productDescription: 'Vehicle finance for eligible retail customers',
        lobCode: 'RETAIL',
        minimumAmount: 100000,
        maximumAmount: 5000000,
        indicativeInterestRate: 9.25,
        minimumTenureMonths: 12,
        maximumTenureMonths: 84,
      },
      {
        productCode: 'BUSINESS_LOAN',
        productName: 'Business Loan',
        productDescription: 'Business finance for eligible customers',
        lobCode: 'RETAIL',
        minimumAmount: 100000,
        maximumAmount: 10000000,
        indicativeInterestRate: 12,
        minimumTenureMonths: 12,
        maximumTenureMonths: 120,
      },
    ];
    return staticProducts.map((p) => this.productToOffer(p));
  }
}
