/**
 * Centralized API endpoints registry.
 * Maps to /TestBedGateway/API/banking/* endpoints.
 */
export const API_ENDPOINTS = {
  BANKING: {
    BANK_LIST: '/bank/list',
    LOB_LIST: '/lob/list',
    CUSTOMER_BANK_LIST: '/customer/bank/list',
    REGISTER: '/customer/register',
    LOGIN: '/web/login',
    BALANCE_ENQUIRY: '/balance/enquiry',
    PROFILE: '/customer/profile',
  },
  AUTH: {
    GENERATE_SESSION_TOKEN: '/auth/generateSessionToken',
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
    SUMMARY: '/dashboard/summary',
    ACCOUNTS: '/dashboard/accounts',
    TRANSACTIONS: '/dashboard/transactions',
    BALANCE_ENQUIRY: '/balance/enquiry',
    REFRESH_ACCOUNT: (accountId: string) => `/dashboard/accounts/${accountId}/refresh`,
  },
} as const;
