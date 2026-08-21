import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonComponent } from '../../../components/button/button.component';
import { ServiceCardComponent } from '../../../components/service-card/service-card.component';

@Component({
  selector: 'sspl-cta-section',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonComponent, ServiceCardComponent],
  templateUrl: './cta-section.component.html',
  styleUrl: './cta-section.component.scss',
})
export class CtaSectionComponent {
  services = [
    {
      icon: '💰',
      title: 'Balance Enquiry',
      description: 'Check your account balance instantly',
    },
    {
      icon: '💸',
      title: 'Fund Transfer',
      description: 'Transfer money 24×7 via IMPS/NEFT/RTGS',
    },
    {
      icon: '📄',
      title: 'Bill Payments',
      description: 'Pay utilities, insurance, taxes in one place',
    },
    {
      icon: '📈',
      title: 'Fixed Deposits',
      description: 'Open and manage FDs with best-in-class rates',
    },
  ];
}
