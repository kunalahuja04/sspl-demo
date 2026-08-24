import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { BankService } from '../../services/bank.service';
import { LobService } from '../../services/lob.service';
import { RegistrationService } from '../../services/registration.service';
import { BankInfo, LobItem, RegistrationResponseBody } from '../../models';

/** Icon map for known LOB codes — falls back to a generic card icon */
const LOB_ICONS: Record<string, string> = {
  RETAIL: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  CORPORATE: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/></svg>`,
  NRI: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  SME: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/><path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9"/><path d="M12 3v6"/></svg>`,
  AGRICULTURE: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>`,
  AGRI: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>`,
  MICROFINANCE: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
  TREASURY: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>`,
  DEFAULT: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>`,
};

@Component({
  selector: 'sspl-register-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register-page.component.html',
  styleUrl: './register-page.component.scss',
})
export class RegisterPageComponent implements OnInit {
  private bankService = inject(BankService);
  private lobService = inject(LobService);
  private registrationService = inject(RegistrationService);
  private router = inject(Router);

  // ── Reactive signals ──────────────────────────────────────────
  readonly banks = this.bankService.banks;
  readonly banksLoading = this.bankService.isLoading;

  /** LOBs fetched from API for the currently selected bank */
  readonly lobOptions = signal<LobItem[]>([]);
  readonly lobsLoading = signal(false);
  readonly lobsError = signal<string | null>(null);

  // ── Form model ─────────────────────────────────────────────────
  selectedBank: BankInfo | null = null;
  selectedLobCode = '';
  username = '';
  mobileNumber = '';
  password = '';
  confirmPassword = '';
  customerId = '';           // Auto-generated on bank select
  showPassword = false;
  showConfirmPassword = false;

  // ── UI state ───────────────────────────────────────────────────
  submitted = false;
  isSubmitting = signal(false);
  currentStep = signal<1 | 2 | 3>(1);
  registeredUser = signal<RegistrationResponseBody['registrationResponse'] | null>(null);
  alertMessage = signal<{ type: 'error' | 'success' | 'info'; text: string } | null>(null);

  // ── Validation helpers ─────────────────────────────────────────
  get passwordStrength(): 'weak' | 'fair' | 'strong' {
    const p = this.password;
    if (!p || p.length < 6) return 'weak';
    const checks = [/[A-Z]/.test(p), /[a-z]/.test(p), /[0-9]/.test(p), /[^A-Za-z0-9]/.test(p), p.length >= 8].filter(Boolean).length;
    if (checks >= 4) return 'strong';
    if (checks >= 2) return 'fair';
    return 'weak';
  }

  get mobileValid(): boolean { return /^[6-9]\d{9}$/.test(this.mobileNumber); }
  get usernameValid(): boolean { return /^[a-zA-Z0-9._]{4,20}$/.test(this.username); }
  get customerIdValid(): boolean { return this.customerId.trim().length >= 5; }
  get passwordsMatch(): boolean { return this.password !== '' && this.password === this.confirmPassword; }

  getIconForLob(code: string): string {
    return LOB_ICONS[code.toUpperCase()] ?? LOB_ICONS['DEFAULT'];
  }

  getLobLabel(code: string): string {
    return this.lobOptions().find((l) => l.lobCode === code)?.lobName ?? code;
  }

  ngOnInit(): void {
    if (this.banks().length === 0) {
      this.bankService.fetchBankList().subscribe({
        next: (banks) => {
          const persisted = this.bankService.selectedBank();
          const bank = persisted || (banks.length > 0 ? banks[0] : null);
          if (bank) {
            this.selectedBank = bank;
            this.generateCustomerId(bank.bankCode);
            this.loadLobsForBank(bank.bankCode);
          }
        },
      });
    } else {
      const persisted = this.bankService.selectedBank();
      const bank = persisted || (this.banks().length > 0 ? this.banks()[0] : null);
      if (bank) {
        this.selectedBank = bank;
        this.generateCustomerId(bank.bankCode);
        this.loadLobsForBank(bank.bankCode);
      }
    }
  }

  onBankChange(event: Event): void {
    const tenantId = (event.target as HTMLSelectElement).value;
    const bank = this.banks().find((b) => b.tenantId === tenantId);
    if (!bank) return;

    this.selectedBank = bank;
    this.bankService.selectBank(bank);
    this.selectedLobCode = '';
    this.lobOptions.set([]);
    this.generateCustomerId(bank.bankCode);
    this.loadLobsForBank(bank.bankCode);
  }

  /**
   * Auto-generates a Customer ID in the format BANKCODE-CUST-XXXXX
   * whenever a bank is selected or changed.
   */
  private generateCustomerId(bankCode: string): void {
    const seq = Math.floor(10000 + Math.random() * 90000);
    this.customerId = `${bankCode}-CUST-${seq}`;
  }

  private loadLobsForBank(bankCode: string): void {
    this.lobsLoading.set(true);
    this.lobsError.set(null);

    this.lobService.fetchLobsForBank(bankCode).subscribe({
      next: (lobs) => {
        this.lobOptions.set(lobs);
        this.lobsLoading.set(false);
        if (!this.selectedLobCode && lobs.length > 0) {
          this.selectedLobCode = lobs[0].lobCode;
        }
      },
      error: () => {
        this.lobsError.set('Could not load banking types. Please retry.');
        this.lobsLoading.set(false);
      },
    });
  }

  retryLoadLobs(): void {
    if (this.selectedBank) this.loadLobsForBank(this.selectedBank.bankCode);
  }

  selectLob(code: string): void {
    this.selectedLobCode = code;
  }

  goToStep2(): void {
    if (!this.selectedBank) {
      this.alertMessage.set({ type: 'error', text: 'Please select a bank to continue.' });
      return;
    }
    if (!this.selectedLobCode) {
      this.alertMessage.set({ type: 'error', text: 'Please select a banking type to continue.' });
      return;
    }
    this.alertMessage.set(null);
    this.currentStep.set(2);
  }

  goBack(): void {
    this.alertMessage.set(null);
    this.submitted = false;
    this.currentStep.set(1);
  }

  togglePasswordVisibility(): void { this.showPassword = !this.showPassword; }
  toggleConfirmPasswordVisibility(): void { this.showConfirmPassword = !this.showConfirmPassword; }

  onSubmit(): void {
    this.submitted = true;
    this.alertMessage.set(null);

    if (!this.selectedBank || !this.selectedLobCode) return;
    if (!this.usernameValid || !this.mobileValid || !this.customerIdValid) return;
    if (!this.password || this.passwordStrength === 'weak') {
      this.alertMessage.set({ type: 'error', text: 'Please use a stronger password (min 8 chars, mix of letters, numbers & symbols).' });
      return;
    }
    if (!this.passwordsMatch) {
      this.alertMessage.set({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    this.isSubmitting.set(true);

    this.registrationService.register({
      bankCode: this.selectedBank.bankCode,
      lobCode: this.selectedLobCode,
      username: this.username,
      mobileNumber: this.mobileNumber,
      password: this.password,
      customerId: this.customerId,
    }).subscribe({
      next: (result) => {
        this.isSubmitting.set(false);
        this.registeredUser.set(result);
        this.currentStep.set(3);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.alertMessage.set({ type: 'error', text: err?.message || 'Registration failed. Please try again.' });
      },
    });
  }

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }
}
