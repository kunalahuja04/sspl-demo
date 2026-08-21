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
    FooterComponent,
  ],
  host: { class: 'block' },
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss',
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
