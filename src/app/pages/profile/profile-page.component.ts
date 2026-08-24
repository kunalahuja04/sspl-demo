import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SideNavComponent } from '../../components/side-nav/side-nav.component';
import { DashboardHeaderComponent } from '../dashboard/components/dashboard-header/dashboard-header.component';
import { ProfileService } from '../../services/profile.service';
import { DashboardService, BankAccount } from '../../services/dashboard.service';
import { BankService } from '../../services/bank.service';
import { AuthService } from '../../services/auth.service';

/** Mapping of LOB code to user-friendly titles and descriptions */
const LOB_METADATA: Record<string, { title: string; desc: string; icon: string }> = {
  RETAIL: {
    title: 'Retail Banking',
    desc: 'Personal Savings, Term Deposits, Consumer Lending & Daily Payments',
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  },
  CORPORATE: {
    title: 'Corporate Banking',
    desc: 'Corporate Accounts, Bulk Payroll, Trade Finance & Treasury Management',
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/></svg>`,
  },
  NRI: {
    title: 'NRI Banking',
    desc: 'NRE/NRO Accounts, Inward Remittance, FCNR Deposits & Global Wealth',
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  },
  SME: {
    title: 'SME & MSME Banking',
    desc: 'Working Capital, Term Loans, Merchant POS & Current Account Facilities',
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/><path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9"/><path d="M12 3v6"/></svg>`,
  },
  AGRICULTURE: {
    title: 'Agriculture & Rural Banking',
    desc: 'Kisan Credit Cards, Agri Crop Loans, Farm Infrastructure & SHG Credit',
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>`,
  },
  MICROFINANCE: {
    title: 'Micro Finance Banking',
    desc: 'Joint Liability Groups, Micro-Enterprise Loans & Financial Inclusion',
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
  },
  TREASURY: {
    title: 'Treasury & Forex',
    desc: 'Foreign Exchange, Hedging Solutions, Government Securities & Liquidity',
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>`,
  },
};

@Component({
  selector: 'sspl-profile-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SideNavComponent,
    DashboardHeaderComponent,
  ],
  templateUrl: './profile-page.component.html',
  styleUrl: './profile-page.component.scss',
})
export class ProfilePageComponent implements OnInit {
  private profileService = inject(ProfileService);
  private dashboardService = inject(DashboardService);
  private bankService = inject(BankService);
  private authService = inject(AuthService);
  private router = inject(Router);

  // Active navigation state for sidebar
  readonly activeNavId = signal<string>('profile');

  // Profile data signals
  readonly profile = this.profileService.profile;
  readonly isLoading = this.profileService.isLoading;
  readonly error = this.profileService.error;

  // Linked accounts from Dashboard Service
  readonly accounts = this.dashboardService.accounts;

  // Selected bank from Bank Service
  readonly selectedBank = this.bankService.selectedBank;
  readonly currentUser = this.authService.currentUser;

  // UI State signals
  readonly copiedKey = signal<string | null>(null);
  readonly toastMessage = signal<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);
  readonly activeTab = signal<'banking' | 'security' | 'preferences'>('banking');
  readonly isRefreshing = signal<boolean>(false);

  // Derived display helpers
  readonly formattedMobileNumber = computed(() => {
    const raw = this.profile()?.mobileNumber || '8884045346';
    if (raw.length === 10) {
      return `+91 ${raw.substring(0, 5)} ${raw.substring(5)}`;
    }
    return raw;
  });

  readonly lobInfo = computed(() => {
    const code = (this.profile()?.lobCode || 'RETAIL').toUpperCase();
    return LOB_METADATA[code] || {
      title: `${code} Banking`,
      desc: 'Digital & Omnichannel Net Banking Facilities',
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>`,
    };
  });

  readonly bankName = computed(() => {
    const code = this.profile()?.bankCode;
    if (this.selectedBank()?.bankCode === code) {
      return this.selectedBank()!.bankName;
    }
    const match = this.bankService.banks().find((b) => b.bankCode === code);
    return match?.bankName || (code ? `${code} Bank` : 'SSPL Partner Bank');
  });

  ngOnInit(): void {
    // Fetch profile and accounts if not already loaded
    this.profileService.fetchProfile().subscribe();
    if (this.accounts().length === 0) {
      this.dashboardService.fetchDashboardData().subscribe();
    }
  }

  onNavChange(navId: string): void {
    if (navId === 'dashboard' || navId === 'my-accounts') {
      this.router.navigate(['/dashboard']);
    } else if (navId === 'profile') {
      // already on profile
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  refreshProfile(): void {
    this.isRefreshing.set(true);
    this.profileService.fetchProfile().subscribe({
      next: () => {
        this.isRefreshing.set(false);
        this.showToast('success', 'Profile and banking details refreshed successfully.');
      },
      error: () => {
        this.isRefreshing.set(false);
        this.showToast('error', 'Unable to refresh profile details at this moment.');
      },
    });
  }

  copyToClipboard(text: string, label: string, key: string): void {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      this.copiedKey.set(key);
      this.showToast('success', `${label} copied to clipboard!`);
      setTimeout(() => {
        if (this.copiedKey() === key) {
          this.copiedKey.set(null);
        }
      }, 2500);
    });
  }

  downloadProfileSlip(): void {
    this.showToast('info', 'Generating Official Profile Verification Slip (PDF)...');
  }

  showToast(type: 'success' | 'info' | 'error', text: string): void {
    this.toastMessage.set({ type, text });
    setTimeout(() => {
      if (this.toastMessage()?.text === text) {
        this.toastMessage.set(null);
      }
    }, 4000);
  }
}
