import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpResponse,
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
 * returns realistic mocked data structured within standard SSPL Bank response envelopes.
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

  // Helper to construct mock envelope response
  const createEnvelopeResponse = <T>(
    body: T,
    status: 'success' | 'failed' = 'success',
  ): HttpResponse<ApiResponse<T>> => {
    return new HttpResponse<ApiResponse<T>>({
      status: 200,
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

  // 1. Generate Session Token (Pre-login)
  if (url.includes(API_ENDPOINTS.AUTH.GENERATE_SESSION_TOKEN)) {
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

    return of(createEnvelopeResponse(responseBody)).pipe(delay(mockDelay));
  }

  // 1b. Bank List Endpoint (Post session-token, pre-login)
  if (url.includes(API_ENDPOINTS.AUTH.BANK_LIST)) {
    const bankListBody = {
      bankListResponse: {
        banks: [
          {
            bankCode: 'BHARAT',
            bankShortCode: 'BHAR',
            tenantId: 'TENANTBHARAT',
            bankName: 'Bharat Bank',
            theme: {
              headerBgColor: '#082F49',
              menuBgColor: '#075985',
              footerBgColor: '#041F31',
            },
          },
          {
            bankCode: 'COSMOS',
            bankShortCode: 'COSM',
            tenantId: 'TENANTCOSMOS',
            bankName: 'Cosmos Bank',
            theme: {
              headerBgColor: '#9A3412',
              menuBgColor: '#7C2D12',
              footerBgColor: '#431407',
            },
          },
          {
            bankCode: 'DNS',
            bankShortCode: 'DNSB',
            tenantId: 'TENANTDNS',
            bankName: 'DNS Bank',
            theme: {
              headerBgColor: '#166534',
              menuBgColor: '#14532D',
              footerBgColor: '#052E16',
            },
          },
          {
            bankCode: 'JALGAONJANATA',
            bankShortCode: 'JALG',
            tenantId: 'TENANTJALGAONJANATA',
            bankName: 'Jalgaon Janata Bank',
            theme: {
              headerBgColor: '#854D0E',
              menuBgColor: '#A16207',
              footerBgColor: '#422006',
            },
          },
          {
            bankCode: 'KARADURBAN',
            bankShortCode: 'KARA',
            tenantId: 'TENANTKARADURBAN',
            bankName: 'Karad Urban Bank',
            theme: {
              headerBgColor: '#312E81',
              menuBgColor: '#4338CA',
              footerBgColor: '#1E1B4B',
            },
          },
        ],
      },
    };

    return of(createEnvelopeResponse(bankListBody)).pipe(delay(mockDelay));
  }

  // 2. Login Endpoint (Creates Access and Refresh Tokens linked to session)
  if (url.includes(API_ENDPOINTS.AUTH.LOGIN)) {
    const requestBody = req.body?.body || req.body || {};
    const customerId = requestBody.customerId || 'SSPL_USER_84920';
    const tenant = (requestBody.tenantId || 'SSPL001').split('—')[0].trim();
    const sessionTok =
      requestBody.sessionToken ||
      'SES_' + Math.random().toString(36).substring(2, 10).toUpperCase();

    const accessToken =
      'SSPL-AT-' + Math.random().toString(36).substring(2, 12).toUpperCase() + '-' + Date.now();
    const refreshToken =
      'SSPL-RT-' + Math.random().toString(36).substring(2, 12).toUpperCase() + '-' + Date.now();

    const responseBody = {
      accessToken,
      refreshToken,
      sessionToken: sessionTok,
      expiresIn: 900, // 15 mins
      tokenType: 'Bearer',
      user: {
        id: customerId,
        name: 'Rajesh K. Sharma',
        username: customerId,
        tenant: tenant || 'SSPL001',
        lastLogin: '08 Jun, 09:41',
        avatarInitials: 'RK',
        role: 'Personal Banking',
      },
    };

    return of(createEnvelopeResponse(responseBody)).pipe(delay(mockDelay));
  }

  // 2b. Registration Endpoint (New customer onboarding)
  if (url.includes(API_ENDPOINTS.AUTH.REGISTER)) {
    const rb = req.body?.body?.registerRequest || req.body?.registerRequest || {};
    const bankCode: string = rb.bankCode || 'BHARAT';
    const customerId: string =
      rb.customerId || `${bankCode}-CUST-${Math.floor(10000 + Math.random() * 90000)}`;
    const username: string = rb.username || 'user' + Math.random().toString(36).substring(2, 7);
    const lobCode: string = rb.lobCode || 'RETAIL';

    // Derive tenantId from bankCode
    const tenantId = `TENANT${bankCode}`;
    const userSeq = Math.floor(500000000000 + Math.random() * 99999);
    const shortCode = bankCode.substring(0, 4).toUpperCase();
    const userRef = `USER-${shortCode}-${String(userSeq).substring(0, 4)}`;

    const registrationResponse = {
      registrationResponse: {
        bankCode,
        customerId,
        tenantId,
        userReference: userRef,
        lobCode,
        userId: userSeq,
        channelId: 9001,
        username,
      },
    };

    return of(createEnvelopeResponse(registrationResponse)).pipe(delay(mockDelay));
  }

  // 2c. LOB List Endpoint (Fetch Lines of Business for a given bank)
  if (url.includes(API_ENDPOINTS.AUTH.LOB_LIST)) {
    const bankCode: string = (
      req.body?.body?.lobRequest?.bankCode ||
      req.body?.lobRequest?.bankCode ||
      ''
    ).toUpperCase();

    // Each bank has its own set of supported LOBs
    const bankLobMap: Record<string, Array<{ lobCode: string; lobName: string }>> = {
      BHARAT: [
        { lobCode: 'RETAIL', lobName: 'Retail Banking' },
        { lobCode: 'CORPORATE', lobName: 'Corporate Banking' },
        { lobCode: 'SME', lobName: 'SME Banking' },
        { lobCode: 'AGRICULTURE', lobName: 'Agriculture Banking' },
        { lobCode: 'NRI', lobName: 'NRI Banking' },
        { lobCode: 'TREASURY', lobName: 'Treasury & FX' },
      ],
      COSMOS: [
        { lobCode: 'RETAIL', lobName: 'Retail Banking' },
        { lobCode: 'CORPORATE', lobName: 'Corporate Banking' },
        { lobCode: 'NRI', lobName: 'NRI Banking' },
        { lobCode: 'MICROFINANCE', lobName: 'Micro Finance' },
        { lobCode: 'SME', lobName: 'SME Banking' },
      ],
      DNS: [
        { lobCode: 'RETAIL', lobName: 'Retail Banking' },
        { lobCode: 'SME', lobName: 'SME Banking' },
        { lobCode: 'AGRICULTURE', lobName: 'Agriculture Banking' },
        { lobCode: 'MICROFINANCE', lobName: 'Micro Finance' },
      ],
      JALGAONJANATA: [
        { lobCode: 'RETAIL', lobName: 'Retail Banking' },
        { lobCode: 'AGRICULTURE', lobName: 'Agriculture Banking' },
        { lobCode: 'MICROFINANCE', lobName: 'Micro Finance' },
        { lobCode: 'SME', lobName: 'SME Banking' },
      ],
      KARADURBAN: [
        { lobCode: 'AGRICULTURE', lobName: 'Agriculture Banking' },
        { lobCode: 'RETAIL', lobName: 'Retail Banking' },
        { lobCode: 'MICROFINANCE', lobName: 'Micro Finance' },
        { lobCode: 'SME', lobName: 'SME Banking' },
        { lobCode: 'NRI', lobName: 'NRI Banking' },
      ],
    };

    // Fallback with broad defaults
    const lobs = bankLobMap[bankCode] ?? [
      { lobCode: 'RETAIL', lobName: 'Retail Banking' },
      { lobCode: 'CORPORATE', lobName: 'Corporate Banking' },
      { lobCode: 'SME', lobName: 'SME Banking' },
    ];

    const lobListBody = {
      lobListResponse: {
        bankCode,
        lobs,
      },
    };

    return of(createEnvelopeResponse(lobListBody)).pipe(delay(mockDelay));
  }

  // 2d. User Profile Endpoint (Fetch Banking Profile Details)
  if (url.includes(API_ENDPOINTS.AUTH.PROFILE)) {
    let bankCode = 'BHARAT';
    let customerId = 'BHARAT-CUST-10003';
    let tenantId = 'TENANTBHARAT';
    let userRef = 'USER-BHAR-0019';
    let lobCode = 'RETAIL';
    let username = 'vishal123';
    let mobileNumber = '8884045346';

    try {
      const storedBankStr = sessionStorage.getItem('sspl_selected_bank');
      if (storedBankStr) {
        const storedBank = JSON.parse(storedBankStr);
        if (storedBank?.bankCode) {
          bankCode = storedBank.bankCode;
          tenantId = storedBank.tenantId || `TENANT${bankCode}`;
          const shortCode = (storedBank.bankShortCode || bankCode.substring(0, 4)).toUpperCase();
          userRef = `USER-${shortCode}-0019`;
        }
      }
      const storedUserStr = sessionStorage.getItem('sspl_user');
      if (storedUserStr) {
        const storedUser = JSON.parse(storedUserStr);
        if (storedUser?.id) customerId = storedUser.id;
        if (storedUser?.username) username = storedUser.username;
      }
    } catch {
      // Fallback
    }

    const profileBody = {
      profileResponse: {
        bankCode,
        mobileNumber,
        customerId,
        tenantId,
        userReference: userRef,
        lobCode,
        username,
      },
    };

    return of(createEnvelopeResponse(profileBody)).pipe(delay(mockDelay));
  }

  // 3. Refresh Token Endpoint


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

  // 4. Logout Endpoint
  if (url.includes(API_ENDPOINTS.AUTH.LOGOUT)) {
    return of(
      createEnvelopeResponse({ message: 'Session terminated and tokens invalidated successfully' }),
    ).pipe(delay(mockDelay / 2));
  }

  // 5. Dashboard Summary Endpoint
  if (url.includes(API_ENDPOINTS.DASHBOARD.SUMMARY)) {
    const summary: DashboardSummaryData = {
      totalBalanceFormatted: '₹10.32L',
      totalBalanceSubtitle: 'Across all accounts',
      todaysCredits: '+₹1,37,000',
      todaysCreditsCount: '3 transactions',
      todaysDebits: '-₹16,390',
      todaysDebitsCount: '5 transactions',
      activeAccountsCount: '3',
      activeAccountsSubtitle: 'All accounts in good standing',
    };

    return of(createEnvelopeResponse(summary)).pipe(delay(mockDelay));
  }

  // 6. Dashboard Accounts Endpoint
  if (url.includes(API_ENDPOINTS.DASHBOARD.ACCOUNTS)) {
    const accounts: BankAccountData[] = [
      {
        id: 'acc_01',
        type: 'Savings Account',
        category: 'savings',
        accountNumber: '•••• •••• 4521',
        fullAccountNumber: '50100483924521',
        ifsc: 'IFSC: SSPL0001042',
        branch: 'SSPL Navi Mumbai Main',
        availableBalance: '₹1,82,400.00',
        ledgerBalance: '₹1,82,400.00',
        currency: 'INR',
        status: 'Active',
        unclearedFunds: '₹0.00',
        lienAmount: '₹0.00',
        interestRate: '3.50% p.a.',
        nomineeRegistered: true,
      },
      {
        id: 'acc_02',
        type: 'Current Account',
        category: 'current',
        accountNumber: '•••• •••• 8832',
        fullAccountNumber: '50200891028832',
        ifsc: 'IFSC: SSPL0000011',
        branch: 'SSPL Fort, Mumbai',
        availableBalance: '₹8,50,000.00',
        ledgerBalance: '₹8,52,000.00',
        currency: 'INR',
        status: 'Active',
        unclearedFunds: '₹2,000.00 (Cheque in clearing)',
        lienAmount: '₹0.00',
        interestRate: 'N/A (Current Account)',
        nomineeRegistered: true,
      },
      {
        id: 'acc_03',
        type: 'Savings Account (NRI)',
        category: 'nri',
        accountNumber: '•••• •••• 7310',
        fullAccountNumber: '50300174827310',
        ifsc: 'IFSC: SSPL0009001',
        branch: 'SSPL Overseas Branch',
        availableBalance: '$45,200.50',
        ledgerBalance: '$45,200.50',
        currency: 'USD',
        status: 'Active',
        unclearedFunds: '$0.00',
        lienAmount: '$0.00',
        interestRate: '4.25% p.a. (NRE)',
        nomineeRegistered: true,
      },
    ];

    return of(createEnvelopeResponse(accounts)).pipe(delay(mockDelay));
  }

  // 7. Dashboard Transactions Endpoint
  if (url.includes(API_ENDPOINTS.DASHBOARD.TRANSACTIONS)) {
    const transactions: TransactionData[] = [
      {
        id: 'txn_01',
        title: 'NEFT Cr — HDFC Bank',
        date: '08 Jun · A/C •••• 4521',
        account: 'A/C •••• 4521',
        amount: '+₹45,000',
        type: 'credit',
        reference: 'NEFT26060893019',
        status: 'Completed',
      },
      {
        id: 'txn_02',
        title: 'UPI — Swiggy',
        date: '07 Jun · A/C •••• 4521',
        account: 'A/C •••• 4521',
        amount: '-₹850',
        type: 'debit',
        reference: 'UPI26060718392',
        status: 'Completed',
      },
      {
        id: 'txn_03',
        title: 'ATM Withdrawal',
        date: '05 Jun · A/C •••• 4521',
        account: 'A/C •••• 4521',
        amount: '-₹10,000',
        type: 'debit',
        reference: 'ATM26060599104',
        status: 'Completed',
      },
      {
        id: 'txn_04',
        title: 'Salary Credit',
        date: '02 Jun · A/C •••• 4521',
        account: 'A/C •••• 4521',
        amount: '+₹92,000',
        type: 'credit',
        reference: 'SAL26060284920',
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

