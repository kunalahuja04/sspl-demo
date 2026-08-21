import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'sspl-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonComponent],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {
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
