import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'sspl-navbar',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  styles: [
    `
      .bg-brand-selected {
        padding: 8px 14px;
        background: rgba(201, 162, 39, 0.2);
        color: rgb(201, 162, 39);
        font-size: 13px;
        font-weight: 600;
        border-width: medium medium 2px;
        border-style: none none solid;
        border-color: currentcolor currentcolor rgb(201, 162, 39);
        border-image: initial;
        cursor: pointer;
        border-radius: 6px;
      }
    `,
  ],
  template: `
    <div class="w-full">
      <!-- Main Navigation — STICKY -->
      <nav class="sticky z-50 bg-brand-primary border-b border-white/5 shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex items-center h-16">
            <!-- Logo -->
            <div class="flex items-center gap-2">
              <div class="w-9 h-9 bg-brand-accent rounded-lg flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 22h20L12 2z" fill="#0d2240" />
                  <path d="M12 8l-5 10h10l-5-10z" fill="#c9a227" />
                </svg>
              </div>
              <div class="flex flex-col leading-none">
                <span class="font-body font-bold text-white text-lg">SSPL</span>
                <span class="font-body font-bold text-brand-accent text-[10px] tracking-[0.12em]"
                  >BANK</span
                >
              </div>
            </div>

            <!-- Nav Links — close to logo -->
            <div class="hidden lg:flex gap-2 ml-6">
              @for (link of navLinks; track link.label) {
                <a
                  [href]="link.href"
                  class="px-4 py-2 rounded-lg font-body text-[13px] transition-all duration-fast"
                  [class.bg-brand-selected]="link.active"
                  [class.text-brand-primary]="link.active"
                  [class.font-semibold]="link.active"
                  [class.text-white]="!link.active"
                  [class.hover:bg-white/5]="!link.active"
                >
                  {{ link.label }}
                </a>
              }
            </div>

            <!-- Actions -->
            <div class="flex items-end gap-2.5 ml-auto">
              <sspl-button variant="outline-white" size="sm">Net Banking</sspl-button>
              <sspl-button variant="primary" size="sm" [arrow]="true">Login</sspl-button>
            </div>
          </div>
        </div>
      </nav>
    </div>
  `,
})
export class NavbarComponent {
  topLinks = [
    { label: 'Corporate Website', href: '#' },
    { label: 'Investor Relations', href: '#' },
    { label: 'Media Centre', href: '#' },
    { label: 'Careers', href: '#' },
  ];

  navLinks = [
    { label: 'Personal Banking', href: '#', active: true },
    { label: 'Corporate Banking', href: '#', active: false },
    { label: 'NRI Banking', href: '#', active: false },
    { label: 'Investments', href: '#', active: false },
    { label: 'Loans', href: '#', active: false },
  ];
}
