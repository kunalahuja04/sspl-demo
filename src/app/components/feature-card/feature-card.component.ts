import { Component, Input, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'sspl-feature-card',
  standalone: true,
  imports: [CommonModule],
  host: { class: 'block' },
  templateUrl: './feature-card.component.html',
  styleUrl: './feature-card.component.scss',
})
export class FeatureCardComponent {
  @HostBinding('style.display') display = 'block';
  @Input() title = '';
  @Input() description = '';
  @Input() iconBgClass = 'bg-bg-muted';
}