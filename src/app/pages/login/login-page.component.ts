import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { SessionService, SessionTokenResponse } from '../../services/session.service';
import { AuthService } from '../../services/auth.service';
import { BankService } from '../../services/bank.service';
import { ThemeService } from '../../services/theme.service';
import { BankInfo } from '../../models';

interface NoticeItem {
  id: number;
  content: string;
  highlightWords?: string[];
  date: string;
}

interface QuickAction {
  id: string;
  label: string;
  iconSvg: string;
}

@Component({
  selector: 'sspl-login-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
})
export class LoginPageComponent implements OnInit {
  private sessionService = inject(SessionService);
  private authService = inject(AuthService);
  private bankService = inject(BankService);
  private themeService = inject(ThemeService);
  private router = inject(Router);

  // Nav & Tabs State
  activeNavTab: 'personal' | 'corporate' | 'nri' = 'personal';
  activeInfoTab: 'notices' | 'security' = 'notices';
  fontSizeMode: 'sm' | 'md' | 'lg' = 'md';

  // Bank List & Selection (reactive signals from BankService)
  readonly banks = this.bankService.banks;
  readonly banksLoading = this.bankService.isLoading;
  selectedBank: BankInfo | null = null;

  // Login Form Model
  customerId = '';
  password = '';
  captchaInput = '';
  showPassword = false;

  // Session & Captcha state
  sessionTokenData: SessionTokenResponse | null = null;
  captchaLoading = false;
  captchaError: string | null = null;
  isSubmitting = false;
  submitted = false;
  captchaValidationError = '';

  // Feedback notifications
  alertMessage: { type: 'success' | 'error' | 'info'; text: string } | null = null;

  // Quick Action Buttons
  quickActions: QuickAction[] = [
    {
      id: 'balance',
      label: 'Balance Enquiry',
      iconSvg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>`,
    },
    {
      id: 'transfer',
      label: 'Fund Transfer',
      iconSvg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m17 2 4 4-4 4"/><path d="M3 6h18"/><path d="m7 22-4-4 4-4"/><path d="M21 18H3"/></svg>`,
    },
    {
      id: 'bills',
      label: 'Bill Payment',
      iconSvg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="8" x2="16" y1="10" y2="10"/><line x1="8" x2="12" y1="14" y2="14"/><circle cx="15" cy="15" r="2"/></svg>`,
    },
    {
      id: 'fd',
      label: 'Fixed Deposit',
      iconSvg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-1.8.3-.7.4-1.4.4-2.2 0-3.3-2.5-4.5-4-5"/><circle cx="8" cy="11" r="1"/><path d="M15 13a4 4 0 0 0-4-4"/></svg>`,
    },
    {
      id: 'investments',
      label: 'Investments',
      iconSvg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>`,
    },
    {
      id: 'cards',
      label: 'Card Services',
      iconSvg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>`,
    },
    {
      id: 'branch',
      label: 'Branch / ATM',
      iconSvg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
    },
    {
      id: 'support',
      label: 'Customer Care',
      iconSvg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/></svg>`,
    },
  ];

  // Notices List
  notices: NoticeItem[] = [
    {
      id: 1,
      content:
        'Customers can now deposit Income-Tax/Corporate Taxes using all Bank Debit Cards and Credit Cards under State Bank Payment Gateway.',
      date: '06 Jun 2026',
    },
    {
      id: 2,
      content:
        'Use your Card PIN/OTP/CVV2 only at ATMs or Bank websites. Never share with anyone. SSPL Bank never asks for these details over phone or email.',
      date: '03 Jun 2026',
    },
    {
      id: 3,
      content:
        'SSPL Bank introduces 24x7 RTGS transactions. Transfer amounts above ₹2 lakh instantly, any time, any day.',
      date: '28 May 2026',
    },
  ];

  ngOnInit(): void {
    // Step 1: Generate session token to initialize the captcha
    this.generateSessionAndCaptcha();

    // Step 2: Fetch bank list (after session is established for headers)
    this.fetchBankList();

    // Restore previously selected bank from storage
    const persisted = this.bankService.selectedBank();
    if (persisted) {
      this.selectedBank = persisted;
    }
  }

  /**
   * Fetches bank list from API (called after generateSessionToken).
   * Populates the tenant/bank selection dropdown.
   */
  fetchBankList(): void {
    this.bankService.fetchBankList().subscribe({
      next: (banks) => {
        // Set the selected bank to the already-stored one or the first in list
        const current = this.bankService.selectedBank();
        this.selectedBank = current || (banks.length > 0 ? banks[0] : null);
        if (this.selectedBank) {
          this.themeService.applyTheme(this.selectedBank.theme);
        }
      },
      error: () => {
        console.warn('[LoginPage] Could not load bank list — using default theme');
      },
    });
  }

  /**
   * Called when the user changes the bank selection in the dropdown.
   * Applies the bank's theme immediately (live preview before login).
   */
  onBankChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const tenantId = select.value;
    const bank = this.banks().find((b) => b.tenantId === tenantId);
    if (bank) {
      this.selectedBank = bank;
      this.bankService.selectBank(bank);
      this.themeService.applyTheme(bank.theme);
    }
  }

  /**
   * Specific requirement: Calling generateSessionToken.
   * On success of that, the Captcha should load, otherwise it should not generate any captcha.
   */
  generateSessionAndCaptcha(): void {
    this.captchaLoading = true;
    this.captchaError = null;
    this.sessionTokenData = null;

    this.sessionService.generateSessionToken().subscribe({
      next: (response) => {
        this.sessionTokenData = response;
        this.captchaLoading = false;
      },
      error: (err) => {
        this.captchaError = 'Failed to establish secure session token. Please click retry.';
        this.captchaLoading = false;
      },
    });
  }

  /**
   * Pre-fills the demo credentials into the form fields.
   */
  useDemoCredentials(): void {
    // Select the first available bank as demo
    const banks = this.banks();
    if (banks.length > 0 && !this.selectedBank) {
      this.selectedBank = banks[0];
      this.bankService.selectBank(banks[0]);
    }
    this.customerId = 'SSPL_USER_84920';
    this.password = 'SecurePass@2026!';
    if (this.sessionTokenData) {
      this.captchaInput = this.sessionTokenData.captchaCode;
    }
    this.submitted = false;
    this.captchaValidationError = '';

    this.alertMessage = {
      type: 'info',
      text: 'Demo credentials loaded successfully into Customer ID & Password fields.',
    };

    setTimeout(() => {
      if (this.alertMessage?.type === 'info') {
        this.alertMessage = null;
      }
    }, 4000);
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onLoginSubmit(): void {
    this.submitted = true;
    this.alertMessage = null;
    this.captchaValidationError = '';

    const hasEmptyFields = !this.customerId.trim() || !this.password || !this.captchaInput.trim();

    if (!this.sessionTokenData) {
      this.alertMessage = {
        type: 'error',
        text: 'Active session token required. Generating new session...',
      };
      this.generateSessionAndCaptcha();
      return;
    }

    if (!this.selectedBank) {
      this.alertMessage = {
        type: 'error',
        text: 'Please select a bank to continue.',
      };
      return;
    }

    if (hasEmptyFields) {
      return;
    }

    if (!this.sessionService.validateCaptcha(this.captchaInput)) {
      this.captchaValidationError = 'Captcha does not match';
      this.generateSessionAndCaptcha();
      this.captchaInput = '';
      return;
    }

    this.isSubmitting = true;

    // Call Login API — uses the selected bank's tenantId as the tenant
    this.authService
      .login(this.selectedBank.tenantId, this.customerId, this.sessionTokenData?.sessionToken)
      .subscribe({
        next: (user) => {
          this.isSubmitting = false;
          this.submitted = false;

          this.alertMessage = {
            type: 'success',
            text: `Welcome back, ${user.user.name || this.customerId}! Redirecting to your dashboard...`,
          };

          // Navigate to dashboard after brief confirmation
          setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 500);
        },
        error: (err) => {
          this.isSubmitting = false;
          this.alertMessage = {
            type: 'error',
            text:
              err?.message ||
              'Authentication failed. Please check credentials or generate a new session.',
          };
          this.generateSessionAndCaptcha();
        },
      });
  }

  setFontSize(mode: 'sm' | 'md' | 'lg'): void {
    this.fontSizeMode = mode;
  }

  navigateToHome(): void {
    this.router.navigate(['/']);
  }
}
