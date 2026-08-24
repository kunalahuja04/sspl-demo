import { Routes } from '@angular/router';
import { LandingPageComponent } from './pages/landing/landing-page.component';
import { LoginPageComponent } from './pages/login/login-page.component';
import { DashboardPageComponent } from './pages/dashboard/dashboard-page.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: LandingPageComponent,
    title: 'SSPL Bank — Omnichannel Digital Banking Platform',
  },
  {
    path: 'login',
    component: LoginPageComponent,
    title: 'Login to Net Banking — SSPL Bank',
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./pages/register/register-page.component').then((m) => m.RegisterPageComponent),
    title: 'Register for Net Banking — SSPL Bank',
  },
  {
    path: 'dashboard',
    component: DashboardPageComponent,
    canActivate: [authGuard],
    title: 'Dashboard — SSPL Net Banking',
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./pages/profile/profile-page.component').then((m) => m.ProfilePageComponent),
    canActivate: [authGuard],
    title: 'User Profile & Banking Details — SSPL Bank',
  },
  {
    path: 'balance-enquiry',
    loadComponent: () =>
      import('./pages/balance-enquiry/balance-enquiry-page.component').then(
        (m) => m.BalanceEnquiryPageComponent,
      ),
    canActivate: [authGuard],
    title: 'Balance Enquiry — SSPL Net Banking',
  },
  {
    path: 'loans',
    loadComponent: () =>
      import('./pages/loans/loans-page.component').then((m) => m.LoansPageComponent),
    canActivate: [authGuard],
    title: 'Loans & Lending Offerings — SSPL Net Banking',
  },
  {
    path: 'my-accounts',

    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
