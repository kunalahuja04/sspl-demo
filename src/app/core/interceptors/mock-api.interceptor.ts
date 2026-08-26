import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpResponse,
  HttpHeaders,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../config/api-endpoints';
import { DeviceInfoService } from '../services/device-info.service';
import {
  GenerateSessionTokenResponse,
  LoginResponse,
  RefreshTokenResponse,
  LogoutResponse,
  ApiResponse,
  DashboardSummaryData,
  BankAccountData,
  TransactionData,
} from '../../models';

/**
 * Mock API Interceptor
 * Intercepts outgoing requests when `environment.useMockApi === true` and
 * returns realistic mocked data structured within standard TestBedGateway response envelopes.
 * Emulates asynchronous backend network delays using RxJS delay.
 */
export const mockApiInterceptor: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  // If mock mode is turned off, pass through to actual backend server
  if (!environment.useMockApi) {
    return next(req);
  }

  const deviceInfoService = inject(DeviceInfoService);
  const url = req.url;
  const mockDelay = environment.mockDelayMs || 400;

  // Extract requestNo from request body if envelope was used
  const reqNo = req.body?.header?.requestNo || deviceInfoService.generateRequestNo();
  const txnId = deviceInfoService.generateTxnId();

  // Helper to construct mock envelope response
  const createEnvelopeResponse = <T>(
    body: T,
    status: 'success' | 'failed' | 'error' = 'success',
    headers: HttpHeaders = new HttpHeaders(),
  ): HttpResponse<ApiResponse<T>> => {
    return new HttpResponse<ApiResponse<T>>({
      status: 200,
      headers,
      body: {
        header: {
          requestNo: reqNo,
          status,
          txnId: deviceInfoService.generateTxnId(),
        },
        body,
      },
    });
  };

  // 1. Generate Session Token (Pre-login initialization)
  if (
    url.includes('/security/generateSessionToken') ||
    url.includes(API_ENDPOINTS.SECURITY.GENERATE_SESSION_TOKEN) ||
    url.includes('/auth/generateSessionToken') ||
    url.includes('generateSessionToken')
  ) {
    const sampleCodes = ['TCWYXg', 'K8M4Np', 'R9X2Va', 'Q5B7Zw', 'H3D9Le', 'W2Y6Fs'];

    const chosenCode = sampleCodes[Math.floor(Math.random() * sampleCodes.length)];
    const token =
      'SSPL-SES-' + Math.random().toString(36).substring(2, 8).toUpperCase() + '-' + Date.now();

    const noiseLines = [
      { x1: 5, y1: 15, x2: 135, y2: 25, color: 'rgba(13, 34, 64, 0.25)' },
      { x1: 10, y1: 30, x2: 130, y2: 10, color: 'rgba(201, 162, 39, 0.35)' },
      { x1: 20, y1: 8, x2: 120, y2: 32, color: 'rgba(13, 34, 64, 0.20)' },
    ];

    const responseBody = {
      sessionToken: token,
      expiresAt: Date.now() + 15 * 60 * 1000,
      captchaCode: chosenCode,
      noiseLines,
    };

    const headers = new HttpHeaders({
      authorization: token,
      'Access-Control-Expose-Headers': 'authorization, Authorization',
    });

    return of(createEnvelopeResponse(responseBody, 'success', headers)).pipe(delay(mockDelay));
  }



  // 1b. Bank List Endpoint (/TestBedGateway/API/banking/bank/list)
  if (
    url.includes(API_ENDPOINTS.BANKING.BANK_LIST) ||
    url.includes('/banking/bank/list') ||
    url.includes('/auth/bankList')
  ) {
    const bankListBody = {
      bankListResponse: {
        banks: [
          {
            bankId: 'BANK0001',
            tenantId: 'TENANT0001',
            bankName: 'Bharat Sahakari Bank Ltd',
            theme: {
              footerText: '#041F31',
              primaryColor: '#082F49',
              secondaryColor: '#075985',
              headerBgColor: '#082F49',
              menuBgColor: '#075985',
              footerBgColor: '#041F31',
            },
            shortName: 'BHAR',
            bankCode: 'BANK0001',
            bankShortCode: 'BHAR',
          },
          {
            bankId: 'BANK0003',
            tenantId: 'TENANT0003',
            bankName: 'Cosmos Cooperative Bank Ltd',
            theme: {
              footerText: '#431407',
              primaryColor: '#9A3412',
              secondaryColor: '#7C2D12',
              headerBgColor: '#9A3412',
              menuBgColor: '#7C2D12',
              footerBgColor: '#431407',
            },
            shortName: 'CCBL',
            bankCode: 'BANK0003',
            bankShortCode: 'CCBL',
          },
          {
            bankId: 'BANK0002',
            tenantId: 'TENANT0002',
            bankName: 'DNS Bank',
            theme: {
              footerText: '#052E16',
              primaryColor: '#166534',
              secondaryColor: '#14532D',
              headerBgColor: '#166534',
              menuBgColor: '#14532D',
              footerBgColor: '#052E16',
            },
            shortName: 'DNS',
            bankCode: 'BANK0002',
            bankShortCode: 'DNS',
          },
          {
            bankId: 'BANK0004',
            tenantId: 'TENANT0004',
            bankName: 'Jalgaon Janata Bank Ltd',
            theme: {
              footerText: '#422006',
              primaryColor: '#854D0E',
              secondaryColor: '#A16207',
              headerBgColor: '#854D0E',
              menuBgColor: '#A16207',
              footerBgColor: '#422006',
            },
            shortName: 'JJBL',
            bankCode: 'BANK0004',
            bankShortCode: 'JJBL',
          },
          {
            bankId: 'BANK0005',
            tenantId: 'TENANT0005',
            bankName: 'Karad Urban Cooperative Bank',
            theme: {
              footerText: '#1E1B4B',
              primaryColor: '#312E81',
              secondaryColor: '#4338CA',
              headerBgColor: '#312E81',
              menuBgColor: '#4338CA',
              footerBgColor: '#1E1B4B',
            },
            shortName: 'KUCB',
            bankCode: 'BANK0005',
            bankShortCode: 'KUCB',
          },
        ],
      },
    };

    return of(createEnvelopeResponse(bankListBody)).pipe(delay(mockDelay));
  }

  // 1c. Customer Bank List Endpoint (/TestBedGateway/API/banking/customer/bank/list)
  if (
    url.includes(API_ENDPOINTS.BANKING.CUSTOMER_BANK_LIST) ||
    url.includes('/banking/customer/bank/list')
  ) {
    const customerBankListBody = {
      customerBankListResponse: {
        banks: [
          {
            bankId: 'BANK0001',
            tenantId: 'TENANT0001',
            bankName: 'Bharat Sahakari Bank Ltd',
            shortName: 'BHAR',
          },
          {
            bankId: 'BANK0003',
            tenantId: 'TENANT0003',
            bankName: 'Cosmos Cooperative Bank Ltd',
            shortName: 'CCBL',
          },
          {
            bankId: 'BANK0005',
            tenantId: 'TENANT0005',
            bankName: 'Karad Urban Cooperative Bank',
            shortName: 'KUCB',
          },
        ],
      },
    };

    return of(createEnvelopeResponse(customerBankListBody)).pipe(delay(mockDelay));
  }

  // 2. Web Login Endpoint (/TestBedGateway/API/banking/web/login)
  if (
    url.includes(API_ENDPOINTS.BANKING.LOGIN) ||
    url.includes('/banking/web/login') ||
    url.includes('/auth/login')
  ) {
    const reqData =
      req.body?.body?.webLoginRequest ||
      req.body?.webLoginRequest ||
      req.body?.body ||
      req.body ||
      {};
    const bankId = reqData.bankId || 'BANK0004';
    const username = reqData.username || reqData.customerId || 'sagar123';
    const tenant = reqData.tenantId || `TENANT${bankId.replace('BANK', '')}`;

    const accessToken =
      'SSPL-AT-' + Math.random().toString(36).substring(2, 12).toUpperCase() + '-' + Date.now();
    const refreshToken =
      'SSPL-RT-' + Math.random().toString(36).substring(2, 12).toUpperCase() + '-' + Date.now();
    const sessionTok =
      reqData.sessionToken || 'SES_' + Math.random().toString(36).substring(2, 10).toUpperCase();

    const responseBody = {
      status: 1,
      accessToken,
      refreshToken,
      sessionToken: sessionTok,
      expiresIn: 900,
      tokenType: 'Bearer',
      user: {
        id: username,
        name: username === 'sagar123' ? 'Sagar Koli' : 'Rajesh K. Sharma',
        username,
        tenant,
        lastLogin: '25 Aug, 10:15',
        avatarInitials: username === 'sagar123' ? 'SK' : 'RK',
        role: 'Personal Banking',
      },
    };

    const headers = new HttpHeaders({
      authorization: accessToken,
      'Access-Control-Expose-Headers': 'authorization, Authorization',
    });

    return of(createEnvelopeResponse(responseBody, 'success', headers)).pipe(delay(mockDelay));
  }



  // 2b. Customer Register Endpoint (/TestBedGateway/API/banking/customer/register)
  if (
    url.includes(API_ENDPOINTS.BANKING.REGISTER) ||
    url.includes('/banking/customer/register') ||
    url.includes('/auth/register')
  ) {
    const rb = req.body?.body?.registerRequest || req.body?.registerRequest || {};
    const bankId: string = rb.bankId || rb.bankCode || 'BANK0004';
    const customerId: string =
      rb.customerId || `JALGAON-CUST-${Math.floor(10000 + Math.random() * 90000)}`;
    const username: string = rb.username || 'sagar123';
    const firstName: string = rb.firstName || 'Sagar';
    const lastName: string = rb.lastName || 'Koli';
    const lobCode: string = rb.lobCode || 'RETAIL';
    const tenantId = `TENANT${bankId.replace('BANK', '')}`;
    const userSeq = Math.floor(500000000000 + Math.random() * 99999);
    const userRef = `USER-JJBL-00${String(userSeq).substring(10)}`;

    const registrationResponse = {
      registrationResponse: {
        bankId,
        bankCode: bankId,
        customerId,
        tenantId,
        userReference: userRef,
        lobCode,
        userId: userSeq,
        channelId: 9001,
        username,
        firstName,
        lastName,
      },
    };

    return of(createEnvelopeResponse(registrationResponse)).pipe(delay(mockDelay));
  }

  // 2c. LOB List Endpoint (/TestBedGateway/API/banking/lob/list)
  if (
    url.includes(API_ENDPOINTS.BANKING.LOB_LIST) ||
    url.includes('/banking/lob/list') ||
    url.includes('/auth/getLobList')
  ) {
    const bankId: string = (
      req.body?.body?.lobRequest?.bankId ||
      req.body?.lobRequest?.bankId ||
      req.body?.body?.lobRequest?.bankCode ||
      req.body?.lobRequest?.bankCode ||
      'BANK0001'
    ).toUpperCase();

    const bankLobMap: Record<string, Array<{ lobCode: string; lobName: string }>> = {
      BANK0001: [
        { lobCode: 'RETAIL', lobName: 'Retail Banking' },
        { lobCode: 'AGRICULTURE', lobName: 'Agriculture Banking' },
      ],
      BANK0002: [
        { lobCode: 'RETAIL', lobName: 'Retail Banking' },
        { lobCode: 'SME', lobName: 'SME Banking' },
        { lobCode: 'AGRICULTURE', lobName: 'Agriculture Banking' },
      ],
      BANK0003: [
        { lobCode: 'RETAIL', lobName: 'Retail Banking' },
        { lobCode: 'CORPORATE', lobName: 'Corporate Banking' },
        { lobCode: 'NRI', lobName: 'NRI Banking' },
      ],
      BANK0004: [
        { lobCode: 'RETAIL', lobName: 'Retail Banking' },
        { lobCode: 'AGRICULTURE', lobName: 'Agriculture Banking' },
        { lobCode: 'MICROFINANCE', lobName: 'Micro Finance' },
      ],
      BANK0005: [
        { lobCode: 'AGRICULTURE', lobName: 'Agriculture Banking' },
        { lobCode: 'RETAIL', lobName: 'Retail Banking' },
        { lobCode: 'MICROFINANCE', lobName: 'Micro Finance' },
      ],
      BHARAT: [
        { lobCode: 'RETAIL', lobName: 'Retail Banking' },
        { lobCode: 'AGRICULTURE', lobName: 'Agriculture Banking' },
      ],
    };

    const lobs = bankLobMap[bankId] ?? [
      { lobCode: 'RETAIL', lobName: 'Retail Banking' },
      { lobCode: 'AGRICULTURE', lobName: 'Agriculture Banking' },
    ];

    const lobListBody = {
      lobListResponse: {
        bankId,
        lobs,
      },
    };

    return of(createEnvelopeResponse(lobListBody)).pipe(delay(mockDelay));
  }

  // 2d. Customer Profile Endpoint (/TestBedGateway/API/banking/customer/profile)
  if (
    url.includes(API_ENDPOINTS.BANKING.PROFILE) ||
    url.includes('/banking/customer/profile') ||
    url.includes('/auth/profile')
  ) {
    let firstName = 'Sagar';
    let lastName = 'Koli';
    let fullName = 'Sagar Koli';
    let bankId = 'BANK0004';
    let bankName = 'Jalgaon Janata Bank Ltd';
    let mobileNumber = '8898832785';
    let customerId = 'JALGAON-CUST-10001';
    let tenantId = 'TENANT0004';
    let userReference = 'USER-JJBL-0022';
    let lobCode = 'RETAIL';
    let username = 'sagar123';

    try {
      const storedBankStr = sessionStorage.getItem('sspl_selected_bank');
      if (storedBankStr) {
        const storedBank = JSON.parse(storedBankStr);
        if (storedBank?.bankId) bankId = storedBank.bankId;
        if (storedBank?.bankName) bankName = storedBank.bankName;
        if (storedBank?.tenantId) tenantId = storedBank.tenantId;
        if (storedBank?.shortName) userReference = `USER-${storedBank.shortName}-0022`;
      }
      const storedUserStr = sessionStorage.getItem('sspl_user');
      if (storedUserStr) {
        const storedUser = JSON.parse(storedUserStr);
        if (storedUser?.id) customerId = storedUser.id;
        if (storedUser?.username) username = storedUser.username;
        if (storedUser?.name) {
          fullName = storedUser.name;
          const parts = storedUser.name.split(' ');
          firstName = parts[0] || firstName;
          lastName = parts.slice(1).join(' ') || lastName;
        }
      }
    } catch {
      // Fallback
    }

    const profileBody = {
      profileResponse: {
        firstName,
        lastName,
        bankId,
        mobileNumber,
        customerId,
        tenantId,
        fullName,
        bankName,
        userReference,
        lobCode,
        username,
      },
    };

    return of(createEnvelopeResponse(profileBody)).pipe(delay(mockDelay));
  }

  // 3. Balance Enquiry Endpoint (/TestBedGateway/API/banking/balance/enquiry)
  if (
    url.includes(API_ENDPOINTS.BANKING.BALANCE_ENQUIRY) ||
    url.includes('/banking/balance/enquiry') ||
    url.includes('/dashboard/balanceEnquiry')
  ) {
    const currentTxnId = deviceInfoService.generateTxnId();
    const balanceResponseBody = {
      balanceResponse: {
        correlationId: reqNo,
        accounts: [
          {
            ledgerBalance: 72500.75,
            accountType: 'SAVINGS',
            accountNumberMasked: 'XXXXXXXX0001',
            currency: 'INR',
            availableBalance: 72000.75,
          },
          {
            ledgerBalance: 127975,
            accountType: 'CURRENT',
            accountNumberMasked: 'XXXXXXXX0002',
            currency: 'INR',
            availableBalance: 324460,
          },
          {
            ledgerBalance: 4850.0,
            accountType: 'EEFC_SAVINGS',
            accountNumberMasked: 'XXXXXXXX0003',
            currency: 'USD',
            availableBalance: 4850.0,
          },
        ],
        transactionId: currentTxnId,
      },
    };


    return of(createEnvelopeResponse(balanceResponseBody)).pipe(delay(mockDelay));
  }

  // 4. Refresh Token Endpoint
  if (url.includes(API_ENDPOINTS.AUTH.REFRESH_TOKEN)) {
    const newAccessToken =
      'SSPL-AT-' + Math.random().toString(36).substring(2, 12).toUpperCase() + '-' + Date.now();
    const newRefreshToken =
      'SSPL-RT-' + Math.random().toString(36).substring(2, 12).toUpperCase() + '-' + Date.now();

    const responseBody = {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: 900,
      tokenType: 'Bearer',
    };

    return of(createEnvelopeResponse(responseBody)).pipe(delay(mockDelay));
  }

  // 5. Logout Endpoint
  if (url.includes(API_ENDPOINTS.AUTH.LOGOUT)) {
    return of(
      createEnvelopeResponse({ message: 'Session terminated and tokens invalidated successfully' }),
    ).pipe(delay(mockDelay / 2));
  }

  // 6. Dashboard Summary Endpoint
  if (url.includes(API_ENDPOINTS.DASHBOARD.SUMMARY)) {
    const summary: DashboardSummaryData = {
      totalBalanceFormatted: '₹3.96L',
      totalBalanceSubtitle: 'Across all accounts',
      todaysCredits: '+₹1,37,000',
      todaysCreditsCount: '2 transactions',
      todaysDebits: '-₹16,390',
      todaysDebitsCount: '3 transactions',
      activeAccountsCount: '2',
      activeAccountsSubtitle: 'All accounts in good standing',
    };

    return of(createEnvelopeResponse(summary)).pipe(delay(mockDelay));
  }

  // 7. Dashboard Accounts Endpoint
  if (url.includes(API_ENDPOINTS.DASHBOARD.ACCOUNTS)) {
    const accounts: BankAccountData[] = [
      {
        id: 'acc_01',
        type: 'Savings Account',
        category: 'savings',
        accountNumber: '•••• •••• 0001',
        fullAccountNumber: '50100483920001',
        ifsc: 'IFSC: JJBL0001042',
        branch: 'Jalgaon Main Branch',
        availableBalance: '₹72,000.75',
        ledgerBalance: '₹72,500.75',
        currency: 'INR',
        status: 'Active',
        unclearedFunds: '₹500.00 (Cheque in clearing)',
        lienAmount: '₹0.00',
        interestRate: '3.50% p.a.',
        nomineeRegistered: true,
      },
      {
        id: 'acc_02',
        type: 'Current Account',
        category: 'current',
        accountNumber: '•••• •••• 0002',
        fullAccountNumber: '50200891020002',
        ifsc: 'IFSC: JJBL0000011',
        branch: 'Pune Camp Branch',
        availableBalance: '₹3,24,460.00',
        ledgerBalance: '₹1,27,975.00',
        currency: 'INR',
        status: 'Active',
        unclearedFunds: '₹0.00',
        lienAmount: '₹0.00',
        interestRate: 'N/A (Current Account)',
        nomineeRegistered: true,
      },
    ];

    return of(createEnvelopeResponse(accounts)).pipe(delay(mockDelay));
  }

  // 8. Dashboard Transactions Endpoint
  if (url.includes(API_ENDPOINTS.DASHBOARD.TRANSACTIONS)) {
    const transactions: TransactionData[] = [
      {
        id: 'txn_01',
        title: 'NEFT Cr — Salary Credit',
        date: '25 Aug · A/C •••• 0001',
        account: 'A/C •••• 0001',
        amount: '+₹72,000',
        type: 'credit',
        reference: 'NEFT26082593019',
        status: 'Completed',
      },
      {
        id: 'txn_02',
        title: 'UPI — Swiggy Orders',
        date: '24 Aug · A/C •••• 0001',
        account: 'A/C •••• 0001',
        amount: '-₹850',
        type: 'debit',
        reference: 'UPI26082418392',
        status: 'Completed',
      },
      {
        id: 'txn_03',
        title: 'RTGS Cr — Business Payment',
        date: '22 Aug · A/C •••• 0002',
        account: 'A/C •••• 0002',
        amount: '+₹65,000',
        type: 'credit',
        reference: 'RTGS26082299104',
        status: 'Completed',
      },
    ];

    return of(createEnvelopeResponse(transactions)).pipe(delay(mockDelay));
  }

  // 8. Balance Enquiry Endpoint
  if (url.includes(API_ENDPOINTS.DASHBOARD.BALANCE_ENQUIRY)) {
    const balanceResponseBody = {
      balanceResponse: {
        correlationId: reqNo,
        accounts: [
          {
            ledgerBalance: 182400,
            accountType: 'SAVINGS',
            accountNumberMasked: 'XXXXXXXX4521',
            currency: 'INR',
            availableBalance: 182400,
          },
          {
            ledgerBalance: 852000,
            accountType: 'CURRENT',
            accountNumberMasked: 'XXXXXXXX8832',
            currency: 'INR',
            availableBalance: 850000,
          },
          {
            ledgerBalance: 45200,
            accountType: 'NRE_SAVINGS',
            accountNumberMasked: 'XXXXXXXX7310',
            currency: 'USD',
            availableBalance: 45200,
          },
        ],
      },
    };

    return of(createEnvelopeResponse(balanceResponseBody)).pipe(delay(mockDelay));
  }

  // Pass through if not explicitly intercepted
  return next(req);
};
