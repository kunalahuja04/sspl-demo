import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SideNavComponent } from '../../components/side-nav/side-nav.component';
import { DashboardHeaderComponent } from './components/dashboard-header/dashboard-header.component';
import { KpiCardsComponent } from './components/kpi-cards/kpi-cards.component';
import { AccountListComponent } from './components/account-list/account-list.component';
import { RecentTransactionsComponent } from './components/recent-transactions/recent-transactions.component';
import { ExportModalComponent } from './components/export-modal/export-modal.component';
import { DashboardService, BankAccount } from '../../services/dashboard.service';

@Component({
  selector: 'sspl-dashboard-page',
  standalone: true,
  imports: [
    CommonModule,
    SideNavComponent,
    DashboardHeaderComponent,
    KpiCardsComponent,
    AccountListComponent,
    RecentTransactionsComponent,
    ExportModalComponent,
  ],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss',
})
export class DashboardPageComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private router = inject(Router);

  // Active navigation tab
  readonly activeNavId = signal<string>('dashboard');

  // Modal and toast state signals
  readonly selectedAccount = this.dashboardService.selectedAccount;
  readonly isExportModalOpen = signal<boolean>(false);
  readonly toastMessage = signal<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);

  ngOnInit(): void {
    this.dashboardService.fetchDashboardData().subscribe();
  }

  onNavChange(navId: string): void {
    this.activeNavId.set(navId);
    if (navId !== 'dashboard' && navId !== 'balance-enquiry') {
      this.showToast('info', `Navigating to ${navId.replace('-', ' ').toUpperCase()} section...`);
    }
  }


  openBalanceEnquiry(account: BankAccount): void {
    this.dashboardService.selectAccountForEnquiry(account);
    this.router.navigate(['/balance-enquiry']);
  }

  openExport(): void {
    this.isExportModalOpen.set(true);
  }

  closeExport(): void {
    this.isExportModalOpen.set(false);
  }

  downloadStatement(format: string): void {
    this.isExportModalOpen.set(false);
    this.showToast(
      'success',
      `Exporting statement in ${format.toUpperCase()} format... Download will start shortly.`,
    );
  }

  onViewStatement(): void {
    this.showToast('info', 'Opening full consolidated account statement...');
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
