import { Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DashboardService } from '../../../../services/dashboard.service';

@Component({
  selector: 'sspl-recent-transactions',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './recent-transactions.component.html',
  styleUrl: './recent-transactions.component.scss'
})
export class RecentTransactionsComponent {
  private dashboardService = inject(DashboardService);

  readonly transactions = this.dashboardService.transactions;
  viewStatementClick = output<void>();

  onViewStatement(): void {
    this.viewStatementClick.emit();
  }
}
