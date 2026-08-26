import { ApiRequest, ApiResponse } from './api-envelope.model';

/**
 * 1. Generate Session Token (Pre-login initialization)
 */
export interface GenerateSessionTokenRequestBody {
  [key: string]: unknown;
}

export interface CaptchaNoiseLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
}

export interface GenerateSessionTokenResponseBody {
  sessionToken?: string;
  expiresAt?: number;
  captchaCode?: string;
  noiseLines?: CaptchaNoiseLine[];
}

export type GenerateSessionTokenRequest = ApiRequest<GenerateSessionTokenRequestBody>;
export type GenerateSessionTokenResponse = ApiResponse<GenerateSessionTokenResponseBody>;

/**
 * 1b. Bank List API (/TestBedGateway/API/banking/bank/list)
 */
export interface BankTheme {
  primaryColor: string;
  secondaryColor: string;
  footerText: string;
  // Aliases for legacy component compatibility
  headerBgColor?: string;
  menuBgColor?: string;
  footerBgColor?: string;
}

export interface BankInfo {
  bankId: string;
  tenantId: string;
  bankName: string;
  shortName: string;
  theme: BankTheme;
  // Aliases for legacy component compatibility
  bankCode?: string;
  bankShortCode?: string;
}

export interface BankListResponseBody {
  bankListResponse: {
    banks: BankInfo[];
  };
}

export type BankListRequest = ApiRequest<Record<string, unknown>>;
export type BankListResponse = ApiResponse<BankListResponseBody>;

/**
 * 1c. Customer Bank List API (/TestBedGateway/API/banking/customer/bank/list)
 */
export interface CustomerBankInfo {
  bankId: string;
  tenantId: string;
  bankName: string;
  shortName: string;
}

export interface CustomerBankListRequestBody {
  customerBankRequest: {
    mobileNumber: string;
  };
}

export interface CustomerBankListResponseBody {
  customerBankListResponse: {
    banks: CustomerBankInfo[];
  };
}

export type CustomerBankListRequest = ApiRequest<CustomerBankListRequestBody>;
export type CustomerBankListResponse = ApiResponse<CustomerBankListResponseBody>;

/**
 * 2. Web Login API (/TestBedGateway/API/banking/web/login)
 */
export interface WebLoginRequestBody {
  webLoginRequest: {
    bankId: string;
    username: string;
    password?: string;
  };
}


export interface AuthUserInfo {
  id: string;
  name: string;
  username: string;
  tenant: string;
  role: string;
  lastLogin: string;
  avatarInitials: string;
}

export interface WebLoginResponseBody {
  status: number;
  accessToken?: string;
  refreshToken?: string;
  sessionToken?: string;
  expiresIn?: number;
  tokenType?: string;
  user?: AuthUserInfo;
}

export type LoginRequest = ApiRequest<WebLoginRequestBody>;
export type LoginResponse = ApiResponse<WebLoginResponseBody>;
export type LoginResponseBody = WebLoginResponseBody;

/**
 * 3. Refresh Token API
 */
export interface RefreshTokenRequestBody {
  refreshToken: string;
  sessionToken: string;
}

export interface RefreshTokenResponseBody {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export type RefreshTokenRequest = ApiRequest<RefreshTokenRequestBody>;
export type RefreshTokenResponse = ApiResponse<RefreshTokenResponseBody>;

/**
 * 4. Logout API
 */
export interface LogoutRequestBody {
  sessionToken?: string;
}

export interface LogoutResponseBody {
  message: string;
}

export type LogoutRequest = ApiRequest<LogoutRequestBody>;
export type LogoutResponse = ApiResponse<LogoutResponseBody>;

/**
 * 5. LOB List API (/TestBedGateway/API/banking/lob/list)
 */
export interface LobListRequestBody {
  lobRequest: {
    bankId?: string;
    bankCode?: string;
  };
}

export interface LobItem {
  lobCode: string;
  lobName: string;
}

export interface LobListResponseBody {
  lobListResponse: {
    bankId: string;
    lobs: LobItem[];
    bankCode?: string;
  };
}

export type LobListRequest = ApiRequest<LobListRequestBody>;
export type LobListResponse = ApiResponse<LobListResponseBody>;

/**
 * 6. Customer Register API (/TestBedGateway/API/banking/customer/register)
 */
export type LobCode = string;

export interface RegisterRequestBody {
  registerRequest: {
    customerId: string;
    username: string;
    firstName?: string;
    lastName?: string;
    bankId: string;
    lobCode: LobCode;
    mobileNumber: string;
    password: string;
    bankCode?: string;
  };
}

export interface RegistrationResponseBody {
  registrationResponse: {
    bankId?: string;
    bankCode?: string;
    customerId: string;
    tenantId: string;
    userReference: string;
    lobCode: string;
    userId?: number;
    channelId?: number;
    username: string;
    firstName?: string;
    lastName?: string;
  };
}

export type RegisterRequest = ApiRequest<RegisterRequestBody>;
export type RegisterResponse = ApiResponse<RegistrationResponseBody>;

/**
 * 7. Customer Profile API (/TestBedGateway/API/banking/customer/profile)
 */
export interface ProfileRequestBody {
  [key: string]: unknown;
}

export interface UserProfileData {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  bankId: string;
  bankName?: string;
  mobileNumber: string;
  customerId: string;
  tenantId: string;
  userReference: string;
  lobCode: string;
  username: string;
  bankCode?: string;
}

export interface ProfileResponseBody {
  profileResponse: UserProfileData;
}

export type ProfileRequest = ApiRequest<ProfileRequestBody>;
export type ProfileResponse = ApiResponse<ProfileResponseBody>;


