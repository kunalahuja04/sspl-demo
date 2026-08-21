import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'sspl-button',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
})
export class ButtonComponent {
  @Input() variant: 'primary' | 'secondary' | 'outline-white' | 'outline-dark' = 'primary';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;
  @Input() arrow = false;
  @Input() fullWidth = false;
  @Input() routerLink?: string | any[];
  @Output() clicked = new EventEmitter<Event>();

  get computedClasses(): string {
    const sizeClasses = {
      sm: 'px-4 py-2 text-[13px] rounded-lg',
      md: 'px-5 py-2.5 text-[13px] rounded-lg',
      lg: 'px-7 py-3.5 text-[14px] rounded-xl',
    };

    const variantClasses = {
      primary: 'bg-brand-accent text-brand-primary hover:bg-brand-accent-hover shadow-brand',
      secondary: 'bg-brand-primary text-white hover:bg-brand-primary-hover shadow-md',
      'outline-white':
        'bg-transparent border border-white/30 text-white hover:bg-white/10 hover:border-white/50',
      'outline-dark': 'bg-white border border-brand-primary text-brand-primary hover:bg-bg-muted',
    };

    const widthClass = this.fullWidth ? 'w-full' : '';

    return `${sizeClasses[this.size]} ${variantClasses[this.variant]} ${widthClass}`;
  }
}
