import { Component, input, output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

export interface NavItem {
  id: string;
  label: string;
  icon: 'dashboard' | 'wallet' | 'transfer' | 'document' | 'deposits' | 'investments' | 'cards' | 'loans';
  route?: string;
}

@Component({
  selector: 'sspl-side-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './side-nav.component.html',
  styleUrl: './side-nav.component.scss',
})
export class SideNavComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  // Input signals for active nav identifier
  activeNavId = input<string>('my-accounts');

  // Output event for navigation change
  navChange = output<string>();

  // Auth signals from AuthService
  readonly currentUser = this.authService.currentUser;

  // Local state for logout confirmation modal
  readonly isLogoutModalOpen = signal<boolean>(false);

  // Navigation menu items
  readonly navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'dashboard',
      route: '/dashboard',
    },
    {
      id: 'my-accounts',
      label: 'My Accounts',
      icon: 'wallet',
      route: '/dashboard',
    },
    {
      id: 'funds-transfer',
      label: 'Funds Transfer',
      icon: 'transfer',
    },
    {
      id: 'statements',
      label: 'Statements',
      icon: 'document',
    },
    {
      id: 'deposits',
      label: 'Deposits',
      icon: 'deposits',
    },
    {
      id: 'investments',
      label: 'Investments',
      icon: 'investments',
    },
    {
      id: 'cards',
      label: 'Cards',
      icon: 'cards',
    },
    {
      id: 'loans',
      label: 'Loans',
      icon: 'loans',
    },
  ];

  onSelectNav(item: NavItem): void {
    this.navChange.emit(item.id);
    if (item.route) {
      this.router.navigate([item.route]);
    }
  }

  confirmLogout(): void {
    this.isLogoutModalOpen.set(true);
  }

  cancelLogout(): void {
    this.isLogoutModalOpen.set(false);
  }

  executeLogout(): void {
    this.isLogoutModalOpen.set(false);
    this.authService.logout();
  }
}
