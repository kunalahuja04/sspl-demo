import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface FooterColumn {
  title: string;
  links: string[];
}

@Component({
  selector: 'sspl-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <footer class="bg-brand-primary w-full">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <!-- Brand Column -->
          <div class="lg:col-span-1">
            <div class="flex items-center gap-2.5 mb-4">
              <div class="w-9 h-9 bg-brand-accent rounded-lg flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 22h20L12 2z" fill="#0d2240"/>
                  <path d="M12 8l-5 10h10l-5-10z" fill="#c9a227"/>
                </svg>
              </div>
              <span class="font-body font-bold text-heading-lg text-white">SSPL Bank</span>
            </div>
            <p class="font-body text-body-sm text-white/50 leading-relaxed mb-6 max-w-xs">
              A trusted financial institution committed to delivering innovative, secure, and accessible banking services to millions of customers.
            </p>
            <div class="flex items-center gap-3">
              <a *ngFor="let social of socials" [href]="social.href" class="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <svg class="w-4 h-4 text-white/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="social.icon"></svg>
              </a>
            </div>
          </div>

          <!-- Link Columns -->
          <div *ngFor="let column of columns">
            <h4 class="font-body font-bold text-body-sm text-brand-accent uppercase tracking-wider mb-4">
              {{ column.title }}
            </h4>
            <ul class="space-y-2">
              <li *ngFor="let link of column.links">
                <a href="#" class="font-body text-body-sm text-white/60 hover:text-white transition-colors">
                  {{ link }}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Bottom Bar -->
      <div class="border-t border-white/10">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div class="flex flex-col md:flex-row items-center justify-between gap-3">
            <p class="font-body text-body-xs text-white/40">
              © 2026 SSPL Bank. All rights reserved. SSPL Bank is regulated by the Reserve Bank of India.
            </p>
            <div class="flex items-center gap-5">
              <a *ngFor="let legal of legalLinks" href="#" class="font-body text-body-xs text-white/40 hover:text-white/70 transition-colors">
                {{ legal }}
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  `
})
export class FooterComponent {
  socials = [
    { href: 'tel:', icon: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>' },
    { href: 'mailto:', icon: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>' },
    { href: '#', icon: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>' },
  ];

  columns: FooterColumn[] = [
    {
      title: 'Products',
      links: ['Savings Account', 'Current Account', 'Fixed Deposits', 'Personal Loans', 'Home Loans']
    },
    {
      title: 'Services',
      links: ['Net Banking', 'Mobile App', 'WhatsApp Banking', 'Phone Banking', 'NEFT / RTGS']
    },
    {
      title: 'Support',
      links: ['Help Centre', 'Contact Us', 'Branch Locator', 'ATM Finder', 'Grievance Redressal']
    }
  ];

  legalLinks = ['Privacy Policy', 'Terms of Service', 'Security', 'Disclosure'];
}