import { Component } from '@angular/core';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { HeroSectionComponent } from './hero-section/hero-section.component';
import { FeaturesSectionComponent } from './features-section/features-section.component';
import { CtaSectionComponent } from './cta-section/cta-section.component';
import { FooterComponent } from '../../components/footer/footer.component';

@Component({
  selector: 'sspl-landing-page',
  standalone: true,
  imports: [
    NavbarComponent,
    HeroSectionComponent,
    FeaturesSectionComponent,
    CtaSectionComponent,
    FooterComponent
  ],
  host: { class: 'block' },
  template: `
        <!-- Top Announcement Bar — scrolls away -->
      <div class="bg-bg-surface border-b border-border-default static">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between h-7">
            <span class="font-body text-label-sm text-text-secondary hidden sm:block tracking-wide">
              SSPL Bank — Omnichannel Digital Banking Platform
            </span>
            <div class="flex items-center gap-5 ml-auto">
              @for (link of topLinks; track link.label) {
                <a
                  [href]="link.href"
                  class="font-body text-label-sm text-text-secondary hover:text-brand-primary transition-colors"
                >
                  {{ link.label }}
                </a>
              }
            </div>
          </div>
        </div>
      </div>
    <sspl-navbar></sspl-navbar>
    <main class="block">
      <sspl-hero-section></sspl-hero-section>
      <sspl-features-section></sspl-features-section>
      <sspl-cta-section></sspl-cta-section>
    </main>
    <sspl-footer></sspl-footer>
  `
})
export class LandingPageComponent {
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