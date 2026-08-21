import { Component, inject, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DashboardService, BankAccount } from '../../../../services/dashboard.service';

@Component({
  selector: 'sspl-account-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './account-list.component.html',
  styleUrl: './account-list.component.scss'
})
export class AccountListComponent {
  private dashboardService = inject(DashboardService);

  readonly accounts = this.dashboardService.filteredAccounts;
  readonly searchQuery = this.dashboardService.searchQuery;
  readonly isFilterOpen = signal<boolean>(false);

  // Emitters
  balanceEnquiry = output<BankAccount>();
  exportClick = output<void>();

  toggleFilter(): void {
    this.isFilterOpen.update((v) => !v);
  }

  onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.dashboardService.setSearchQuery(input.value);
  }

  clearSearch(): void {
    this.dashboardService.setSearchQuery('');
  }

  onEnquiry(account: BankAccount): void {
    this.balanceEnquiry.emit(account);
  }

  onExport(): void {
    this.exportClick.emit();
  }
}
