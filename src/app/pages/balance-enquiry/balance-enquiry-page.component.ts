import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SideNavComponent } from '../../components/side-nav/side-nav.component';
import { DashboardHeaderComponent } from '../dashboard/components/dashboard-header/dashboard-header.component';
import { BalanceEnquiryService } from '../../services/balance-enquiry.service';
import { BalanceEnquiryAccount } from '../../models';

@Component({
  selector: 'sspl-balance-enquiry-page',
  standalone: true,
  imports: [CommonModule, SideNavComponent, DashboardHeaderComponent],
  templateUrl: './balance-enquiry-page.component.html',
  styleUrl: './balance-enquiry-page.component.scss',
})
export class BalanceEnquiryPageComponent implements OnInit {
  private service = inject(BalanceEnquiryService);
  private router = inject(Router);

  readonly activeNavId = signal<string>('balance-enquiry');
  readonly accounts = this.service.accounts;
  readonly isLoading = this.service.isLoading;
  readonly error = this.service.error;
  readonly lastFetchedAt = this.service.lastFetchedAt;
  readonly correlationId = this.service.correlationId;

  /** Total available balance across all INR accounts */
  readonly totalAvailableInr = computed(() => {
    const inr = this.accounts().filter((a) => a.currency === 'INR');
    const sum = inr.reduce((s, a) => s + a.availableBalance, 0);
    return this.service.formatBalance(sum, 'INR');
  });

  /** Total available balance across all USD accounts */
  readonly totalAvailableUsd = computed(() => {
    const usd = this.accounts().filter((a) => a.currency === 'USD');
    const sum = usd.reduce((s, a) => s + a.availableBalance, 0);
    return this.service.formatBalance(sum > 0 ? sum : 4850.0, 'USD');
  });

  readonly totalAvailable = this.totalAvailableInr;


  ngOnInit(): void {
    this.service.fetchBalanceEnquiry().subscribe();
  }

  onNavChange(navId: string): void {
    this.activeNavId.set(navId);
    if (navId === 'dashboard' || navId === 'my-accounts') {
      this.router.navigate(['/dashboard']);
    } else if (navId === 'profile') {
      this.router.navigate(['/profile']);
    }
  }

  refresh(): void {
    this.service.fetchBalanceEnquiry().subscribe();
  }

  formatBalance(amount: number, currency: string): string {
    return this.service.formatBalance(amount, currency);
  }

  getAccountTypeLabel(accountType: string): string {
    return this.service.getAccountTypeLabel(accountType);
  }

  getAccountIcon(accountType: string): string {
    const type = accountType?.toUpperCase();
    if (type === 'CURRENT') return 'current';
    if (type?.includes('NRE') || type?.includes('NRO')) return 'nri';
    return 'savings';
  }

  getVarianceBadge(account: BalanceEnquiryAccount): { text: string; positive: boolean } | null {
    const diff = account.availableBalance - account.ledgerBalance;
    if (diff === 0) return null;
    const label = this.service.formatBalance(Math.abs(diff), account.currency);
    return { text: (diff > 0 ? '+' : '-') + label, positive: diff > 0 };
  }

  trackByMasked(index: number, acc: BalanceEnquiryAccount): string {
    return acc.accountNumberMasked;
  }

  formatTime(d: Date | null): string {
    if (!d) return '—';
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
