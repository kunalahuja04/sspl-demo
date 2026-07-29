import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'sspl-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [type]="type"
      [disabled]="disabled"
      (click)="clicked.emit($event)"
      class="inline-flex items-center justify-center gap-2 font-body font-semibold transition-all duration-normal ease-default disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer outline-none"
      [class]="computedClasses"
    >
      <span><ng-content></ng-content></span>
      @if (arrow) {
        <svg
          class="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M5 12h14" />
          <path d="m12 5 7 7-7 7" />
        </svg>
      }
    </button>
  `
})
export class ButtonComponent {
  @Input() variant: 'primary' | 'secondary' | 'outline-white' | 'outline-dark' = 'primary';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;
  @Input() arrow = false;
  @Input() fullWidth = false;
  @Output() clicked = new EventEmitter<Event>();

  get computedClasses(): string {
    const sizeClasses = {
      sm: 'px-4 py-2 text-[13px] rounded-lg',
      md: 'px-5 py-2.5 text-[13px] rounded-lg',
      lg: 'px-7 py-3.5 text-[14px] rounded-xl'
    };

    const variantClasses = {
      primary: 'bg-brand-accent text-brand-primary hover:bg-brand-accent-hover shadow-brand',
      secondary: 'bg-brand-primary text-white hover:bg-brand-primary-hover shadow-md',
      'outline-white': 'bg-transparent border border-white/30 text-white hover:bg-white/10 hover:border-white/50',
      'outline-dark': 'bg-white border border-brand-primary text-brand-primary hover:bg-bg-muted'
    };

    const widthClass = this.fullWidth ? 'w-full' : '';

    return `${sizeClasses[this.size]} ${variantClasses[this.variant]} ${widthClass}`;
  }
}