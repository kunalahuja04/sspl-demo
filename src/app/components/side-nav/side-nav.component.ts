import { Component, input, output, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { BankService } from '../../services/bank.service';

export interface NavSubItem {
  id: string;
  label: string;
  route: string;
  queryParams?: Record<string, string>;
  loanType?: string;
  badge?: string;
}

export interface NavItem {
  id: string;
  label: string;
  icon:
    | 'dashboard'
    | 'wallet'
    | 'balance'
    | 'profile'
    | 'transfer'
    | 'document'
    | 'deposits'
    | 'investments'
    | 'cards'
    | 'loans';
  route?: string;
  isAccordion?: boolean;
  children?: NavSubItem[];
}

@Component({
  selector: 'sspl-side-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './side-nav.component.html',
  styleUrl: './side-nav.component.scss',
})
export class SideNavComponent implements OnInit {
  private authService = inject(AuthService);
  private bankService = inject(BankService);
  private router = inject(Router);

  // Input signals for active nav identifier
  activeNavId = input<string>('my-accounts');

  // Output event for navigation change
  navChange = output<string>();

  // Auth signals from AuthService & BankService
  readonly currentUser = this.authService.currentUser;
  readonly selectedBank = this.bankService.selectedBank;

  // Local state for accordion expansion
  readonly isLoansExpanded = signal<boolean>(false);

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
      id: 'balance-enquiry',
      label: 'Balance Enquiry',
      icon: 'balance',
      route: '/balance-enquiry',
    },
    {
      id: 'profile',
      label: 'User Profile',
      icon: 'profile',
      route: '/profile',
    },
    {
      id: 'loans',
      label: 'Loans & Advances',
      icon: 'loans',
      route: '/loans',
      isAccordion: true,
      children: [
        {
          id: 'loans-home',
          label: 'Home Loan',
          route: '/loans',
          queryParams: { type: 'home' },
          loanType: 'home',
          badge: '8.40%',
        },
        {
          id: 'loans-personal',
          label: 'Personal Loan',
          route: '/loans',
          queryParams: { type: 'personal' },
          loanType: 'personal',
          badge: 'Pre-approved',
        },
        {
          id: 'loans-car',
          label: 'Car / Auto Loan',
          route: '/loans',
          queryParams: { type: 'car' },
          loanType: 'car',
        },
        {
          id: 'loans-business',
          label: 'Business Loan',
          route: '/loans',
          queryParams: { type: 'business' },
          loanType: 'business',
        },
        {
          id: 'loans-gold',
          label: 'Gold Loan',
          route: '/loans',
          queryParams: { type: 'gold' },
          loanType: 'gold',
        },
        {
          id: 'loans-education',
          label: 'Education Loan',
          route: '/loans',
          queryParams: { type: 'education' },
          loanType: 'education',
        },
      ],
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
  ];

  ngOnInit(): void {
    // Auto-expand loans accordion if currently on /loans route or if activeNavId relates to loans
    this.checkIfLoansRoute();
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => this.checkIfLoansRoute());
  }

  private checkIfLoansRoute(): void {
    const url = this.router.url;
    if (url.includes('/loans') || this.activeNavId().startsWith('loans')) {
      this.isLoansExpanded.set(true);
    }
  }

  onSelectNav(item: NavItem): void {
    if (item.isAccordion) {
      // Toggle accordion open/close
      this.isLoansExpanded.update((v) => !v);
      this.navChange.emit(item.id);
      if (item.route) {
        this.router.navigate([item.route]);
      }
      return;
    }

    this.navChange.emit(item.id);
    if (item.route) {
      this.router.navigate([item.route]);
    }
  }

  onSelectSubItem(subItem: NavSubItem, event: MouseEvent): void {
    event.stopPropagation();
    this.navChange.emit(subItem.id);
    this.router.navigate([subItem.route], { queryParams: subItem.queryParams });
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

