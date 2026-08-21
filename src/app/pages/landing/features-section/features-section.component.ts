import { Component, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FeatureCardComponent } from '../../../components/feature-card/feature-card.component';

@Component({
  selector: 'sspl-features-section',
  standalone: true,
  imports: [CommonModule, FeatureCardComponent],
  host: { class: 'block' },
  templateUrl: './features-section.component.html',
  styleUrl: './features-section.component.scss',
})
export class FeaturesSectionComponent {
  @HostBinding('style.display') display = 'block';

  features = [
    {
      title: 'Bank-Grade Security',
      description: '256-bit encryption, two-factor authentication, and real-time fraud monitoring protect every transaction.',
      iconBg: 'bg-[#3b82f6]/10',
      iconSvg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`
    },
    {
      title: 'Instant Transactions',
      description: 'IMPS, UPI, NEFT and RTGS available 24×7. Money reaches the beneficiary in seconds.',
      iconBg: 'bg-[#8b5cf6]/10',
      iconSvg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`
    },
    {
      title: 'Omnichannel Access',
      description: 'Seamless experience across Web, Mobile App, WhatsApp, ATM, and Branch — all in sync.',
      iconBg: 'bg-[#c9a227]/10',
      iconSvg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c9a227" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>`
    },
    {
      title: 'Smart Analytics',
      description: 'Spending insights, investment tracking, and personalised financial health scores at a glance.',
      iconBg: 'bg-[#22c55e]/10',
      iconSvg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/></svg>`
    },
    {
      title: 'Multi-Currency Support',
      description: 'Foreign exchange, international transfers, and multi-currency accounts for NRI customers.',
      iconBg: 'bg-[#ef4444]/10',
      iconSvg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`
    },
    {
      title: 'Dedicated Support',
      description: '24×7 customer support via chat, phone, and email. Your banker is always one tap away.',
      iconBg: 'bg-[#64748b]/10',
      iconSvg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`
    }
  ];
}