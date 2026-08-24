import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';
import { BankService } from '../../../../services/bank.service';

@Component({
  selector: 'sspl-dashboard-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard-header.component.html',
  styleUrl: './dashboard-header.component.scss',
})
export class DashboardHeaderComponent {
  private authService = inject(AuthService);
  private bankService = inject(BankService);

  readonly activeTenant = this.authService.activeTenant;
  readonly selectedBank = this.bankService.selectedBank;
  readonly currentUser = this.authService.currentUser;
  readonly currentFormattedTime = '08 Jun 2026 · 10:02 AM';
  readonly showNotifications = signal<boolean>(false);

  toggleNotifications(): void {
    this.showNotifications.update((v) => !v);
  }
}

