/**
 * Centralized API endpoints registry.
 * Keeps endpoint paths organized and easily maintainable.
 */
export const API_ENDPOINTS = {
  AUTH: {
    GENERATE_SESSION_TOKEN: '/auth/generateSessionToken',
    BANK_LIST: '/auth/bankList',
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOB_LIST: '/auth/getLobList',
    PROFILE: '/auth/profile',
    REFRESH_TOKEN: '/auth/refreshToken',
    LOGOUT: '/auth/logout',
    VALIDATE_CAPTCHA: '/auth/validateCaptcha',
  },
  DASHBOARD: {
    SUMMARY: '/dashboard/summary',
    ACCOUNTS: '/dashboard/accounts',
    TRANSACTIONS: '/dashboard/transactions',
    BALANCE_ENQUIRY: '/dashboard/balanceEnquiry',
    REFRESH_ACCOUNT: (accountId: string) => `/dashboard/accounts/${accountId}/refresh`,
  }
} as const;
