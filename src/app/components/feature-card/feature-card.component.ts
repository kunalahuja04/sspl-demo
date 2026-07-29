import { Component, Input, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'sspl-feature-card',
  standalone: true,
  imports: [CommonModule],
  host: { class: 'block' },
  template: `
    <div class="group bg-bg-surface border border-border-default rounded-xl px-6 py-8 h-full
                transition-all duration-200 ease-out
                hover:shadow-md hover:border-brand-accent cursor-pointer">
      <div
        class="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
        [class]="iconBgClass"
      >
        <ng-content select="[icon]"></ng-content>
      </div>
      <h3 class="font-body font-bold text-[15px] text-text-primary mb-2 leading-snug">
        {{ title }}
      </h3>
      <p class="font-body text-[13px] text-text-secondary leading-relaxed">
        {{ description }}
      </p>
    </div>
  `
})
export class FeatureCardComponent {
  @HostBinding('style.display') display = 'block';
  @Input() title = '';
  @Input() description = '';
  @Input() iconBgClass = 'bg-bg-muted';
}