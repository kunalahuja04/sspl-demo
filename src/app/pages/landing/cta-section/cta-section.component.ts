import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../../../components/button/button.component';
import { ServiceCardComponent } from '../../../components/service-card/service-card.component';

@Component({
  selector: 'sspl-cta-section',
  standalone: true,
  imports: [CommonModule, ButtonComponent, ServiceCardComponent],
  template: `
    <section class="bg-bg-canvas py-20 md:py-28">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <!-- Left Content -->
          <div>
            <h2 class="font-body text-display-lg md:text-display-lg mb-4 font-extrabold">
              <span class="block text-text-primary">Ready to experience</span>
              <span class="block text-brand-accent">the future of banking?</span>
            </h2>
            <p class="font-body text-body-lg text-text-secondary leading-relaxed mb-8 max-w-md">
              Join 2.4 million customers who manage their finances smarter with SSPL Net Banking. Register in under 5 minutes.
            </p>
            <div class="flex flex-wrap gap-4">
              <sspl-button variant="secondary" size="lg" [arrow]="true">
                Login Now
              </sspl-button>
              <sspl-button variant="outline-dark" size="lg">
                Register for Net Banking
              </sspl-button>
            </div>
          </div>

          <!-- Right Content - Service Cards -->
          <div class="grid sm:grid-cols-2 gap-5">
            @for(service of services; track $index) {
              <sspl-service-card
                [title]="service.title"
                [description]="service.description"
              >
                <span icon>{{ service.icon }}</span>
              </sspl-service-card>
            }
          </div>
        </div>
      </div>
    </section>
  `
})
export class CtaSectionComponent {
  services = [
    {
      icon: '💰',
      title: 'Balance Enquiry',
      description: 'Check your account balance instantly'
    },
    {
      icon: '💸',
      title: 'Fund Transfer',
      description: 'Transfer money 24×7 via IMPS/NEFT/RTGS'
    },
    {
      icon: '📄',
      title: 'Bill Payments',
      description: 'Pay utilities, insurance, taxes in one place'
    },
    {
      icon: '📈',
      title: 'Fixed Deposits',
      description: 'Open and manage FDs with best-in-class rates'
    }
  ];
}