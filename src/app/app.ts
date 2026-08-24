import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  constructor() {
    // Eagerly instantiate ThemeService so its Router event subscription is active
    // from the very first navigation. Theme is applied/stripped per-route inside the service.
    inject(ThemeService);
  }
}

