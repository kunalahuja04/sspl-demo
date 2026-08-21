import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonComponent } from '../../../components/button/button.component';
import { ChannelBarComponent } from '../../../components/channel-bar/channel-bar.component';

@Component({
  selector: 'sspl-hero-section',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonComponent, ChannelBarComponent],
  host: { class: 'block' },
  templateUrl: './hero-section.component.html',
  styleUrl: './hero-section.component.scss',
})
export class HeroSectionComponent {
  stats = [
    { value: '2.4M+', label: 'Customers' },
    { value: '₹18,200 Cr', label: 'Deposits' },
    { value: '99.9%', label: 'Uptime' },
    { value: 'ISO 27001', label: 'Certified' },
  ];
}
