import { Injectable, inject, effect } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { BankTheme } from '../models';
import { BankService } from './bank.service';

/**
 * SSPL Bank Theme Service
 * Dynamically applies the selected bank's theme colors to CSS custom properties on document root.
 *
 * Theme is ONLY active on /login and /dashboard (and any future authenticated routes).
 * The landing page (/) always uses the original SSPL default CSS values from tailwind.css.
 *
 * Variables applied on themed routes:
 *   --color-brand-primary       → headerBgColor
 *   --color-brand-primary-hover → lightened headerBgColor
 *   --color-bg-inverse          → headerBgColor
 *   --sspl-menu-bg              → menuBgColor (sidebar/nav background)
 *   --sspl-footer-bg            → footerBgColor
 */

const THEMED_ROUTES = ['/login', '/register', '/dashboard', '/my-accounts', '/profile', '/balance-enquiry'];


@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private bankService = inject(BankService);
  private router = inject(Router);

  /** Tracks whether the current route should receive bank theming */
  private isThemedRoute = false;

  constructor() {
    // Listen to router events to toggle theme on/off based on route
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe((e) => {
      const url = (e as NavigationEnd).urlAfterRedirects;
      this.isThemedRoute = THEMED_ROUTES.some((route) => url.startsWith(route));

      if (this.isThemedRoute) {
        // Re-apply bank theme (or restore from storage) when entering a themed route
        const bank = this.bankService.selectedBank();
        if (bank?.theme) {
          this.applyTheme(bank.theme);
        } else {
          this.restoreThemeFromStorage();
        }
      } else {
        // Leaving a themed route (navigating to landing page) — strip all overrides
        this.stripThemeVariables();
      }
    });

    // Reactively re-apply theme when selected bank changes — but only if on a themed route
    effect(() => {
      const bank = this.bankService.selectedBank();
      if (!this.isThemedRoute) {
        return; // Never touch the landing page
      }
      if (bank?.theme) {
        this.applyTheme(bank.theme);
      } else {
        this.stripThemeVariables();
      }
    });
  }

  /**
   * Applies bank-specific theme colors to the document root CSS variables.
   * Should only be called from themed routes (login, dashboard).
   */
  applyTheme(theme: BankTheme): void {
    const root = document.documentElement;

    root.style.setProperty('--color-brand-primary', theme.headerBgColor);
    root.style.setProperty('--color-brand-primary-hover', this.lightenHex(theme.headerBgColor, 20));
    root.style.setProperty('--color-bg-inverse', theme.headerBgColor);
    root.style.setProperty('--sspl-menu-bg', theme.menuBgColor);
    root.style.setProperty('--sspl-footer-bg', theme.footerBgColor);

    try {
      sessionStorage.setItem(
        'sspl_active_theme',
        JSON.stringify({
          headerBgColor: theme.headerBgColor,
          menuBgColor: theme.menuBgColor,
          footerBgColor: theme.footerBgColor,
        }),
      );
    } catch {
      // Storage fallback
    }
  }

  /**
   * Restores a persisted bank theme on app boot or when re-entering a themed route.
   * Does NOT apply on the landing page — only call from themed routes.
   */
  restoreThemeFromStorage(): void {
    try {
      const stored = sessionStorage.getItem('sspl_active_theme');
      if (stored) {
        const theme: BankTheme = JSON.parse(stored);
        this.applyTheme(theme);
      }
    } catch {
      // Ignore
    }
  }

  /**
   * Removes all inline CSS variable overrides so the landing page reverts to
   * the original SSPL design system defaults defined in tailwind.css.
   * Does NOT clear sessionStorage — the theme is restored when navigating back.
   */
  stripThemeVariables(): void {
    const root = document.documentElement;
    root.style.removeProperty('--color-brand-primary');
    root.style.removeProperty('--color-brand-primary-hover');
    root.style.removeProperty('--color-bg-inverse');
    root.style.removeProperty('--sspl-menu-bg');
    root.style.removeProperty('--sspl-footer-bg');
  }

  /**
   * Utility: Lightens a hex color by a given amount (0–255).
   */
  private lightenHex(hex: string, amount: number): string {
    const clamp = (n: number) => Math.max(0, Math.min(255, n));
    const h = hex.replace('#', '');
    const r = clamp(parseInt(h.substring(0, 2), 16) + amount);
    const g = clamp(parseInt(h.substring(2, 4), 16) + amount);
    const b = clamp(parseInt(h.substring(4, 6), 16) + amount);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
}
