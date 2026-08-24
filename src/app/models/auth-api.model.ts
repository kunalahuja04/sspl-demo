import { ApiRequest, ApiResponse } from './api-envelope.model';

/**
 * 1. Generate Session Token (Pre-login initialization)
 * Request body is empty as device & request tracking is provided in header.
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
 * 1b. Bank List API (Post session-token, pre-login)
 * Returns list of available banks with their display name, tenantId, and theme config.
 */
export interface BankTheme {
  headerBgColor: string;
  menuBgColor: string;
  footerBgColor: string;
}

export interface BankInfo {
  bankCode: string;
  bankShortCode: string;
  tenantId: string;
  bankName: string;
  theme: BankTheme;
}

export interface BankListResponseBody {
  bankListResponse: {
    banks: BankInfo[];
  };
}

export type BankListRequest = ApiRequest<Record<string, unknown>>;
export type BankListResponse = ApiResponse<BankListResponseBody>;


/**
 * 2. Login API (Authenticates customer within session & returns Access/Refresh tokens)
 */
export interface LoginRequestBody {
  tenantId: string;
  customerId: string;
  password?: string;
  captchaCode?: string;
  sessionToken?: string;
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

export interface LoginResponseBody {
  accessToken: string;
  refreshToken: string;
  sessionToken: string;
  expiresIn: number; // in seconds, e.g. 900 (15 min)
  tokenType: string;  // e.g. 'Bearer'
  user: AuthUserInfo;
}

export type LoginRequest = ApiRequest<LoginRequestBody>;
export type LoginResponse = ApiResponse<LoginResponseBody>;

/**
 * 3. Refresh Token API (Generates new access token using valid refresh token)
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
 * 4. Logout API (Revokes active session & tokens)
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
 * 5. LOB List API (Fetches available Lines of Business for a given bank)
 */
export interface LobListRequestBody {
  lobRequest: {
    bankCode: string;
  };
}

export interface LobItem {
  lobCode: string;
  lobName: string;
}

export interface LobListResponseBody {
  lobListResponse: {
    bankCode: string;
    lobs: LobItem[];
  };
}

export type LobListRequest = ApiRequest<LobListRequestBody>;
export type LobListResponse = ApiResponse<LobListResponseBody>;

/**
 * 6. Registration API (Onboards a new customer to a specific bank tenant)
 */
export type LobCode = string; // Resolved dynamically from /auth/getLobList per bank

export interface RegisterRequestBody {
  registerRequest: {
    bankCode: string;
    lobCode: LobCode;
    username: string;
    mobileNumber: string;
    password: string;
    customerId: string;
  };
}

export interface RegistrationResponseBody {
  registrationResponse: {
    bankCode: string;
    customerId: string;
    tenantId: string;
    userReference: string;
    lobCode: string;
    userId: number;
    channelId: number;
    username: string;
  };
}

export type RegisterRequest = ApiRequest<RegisterRequestBody>;
export type RegisterResponse = ApiResponse<RegistrationResponseBody>;

/**
 * 7. Profile API (Retrieves user banking profile and personal details)
 */
export interface ProfileRequestBody {
  [key: string]: unknown;
}

export interface UserProfileData {
  bankCode: string;
  mobileNumber: string;
  customerId: string;
  tenantId: string;
  userReference: string;
  lobCode: string;
  username: string;
}

export interface ProfileResponseBody {
  profileResponse: UserProfileData;
}

export type ProfileRequest = ApiRequest<ProfileRequestBody>;
export type ProfileResponse = ApiResponse<ProfileResponseBody>;


