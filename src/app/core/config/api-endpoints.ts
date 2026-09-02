/**
 * Centralized API endpoints registry.
 * Maps to /TestBedGateway/API/banking/* and /TestBedGateway/API/security/* endpoints.
 */
export const API_ENDPOINTS = {
  SECURITY: {
    GENERATE_SESSION_TOKEN: '/TestBedGateway/API/security/generateSessionToken',
  },
  BANKING: {
    BANK_LIST: '/bank/list',
    LOB_LIST: '/lob/list',
    CUSTOMER_BANK_LIST: '/customer/bank/list',
    REGISTER: '/customer/register',
    LOGIN: '/web/login',
    BALANCE_ENQUIRY: '/balance/enquiry',
    PROFILE: '/customer/profile',
    LOAN_PRODUCTS: '/loan/product/list',
    LOAN_JOURNEY: '/loan/journey',
    SAVE_DETAILS: '/save/loan/personaldetails',
    LOAN_QUOTE: '/calculate/loan/quote',
    SAVE_LOAN: '/save/loan/requirement',
    GET_LOAN_APPLICATION: '/get/loan/application',
    BANK_ACCOUNTS: '/list/eligible/credit/accounts',
    SUBMIT_LOAN: '/submit/loan/application',
    LOAN_APP_STATUS: '/get/loan/application/status',
    LOAN_APP_LIST: '/list/loan/applications',
  },
  AUTH: {
    GENERATE_SESSION_TOKEN: '/TestBedGateway/API/security/generateSessionToken',
    BANK_LIST: '/bank/list',
    LOGIN: '/web/login',
    REGISTER: '/customer/register',
    LOB_LIST: '/lob/list',
    CUSTOMER_BANK_LIST: '/customer/bank/list',
    PROFILE: '/customer/profile',
    REFRESH_TOKEN: '/auth/refreshToken',
    LOGOUT: '/auth/logout',
    VALIDATE_CAPTCHA: '/auth/validateCaptcha',
  },
  DASHBOARD: {
    BALANCE_ENQUIRY: '/balance/enquiry',
    REFRESH_ACCOUNT: (accountId: string) => `/dashboard/accounts/${accountId}/refresh`,
  },
} as const;
