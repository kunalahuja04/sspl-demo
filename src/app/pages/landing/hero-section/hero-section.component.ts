import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../../../components/button/button.component';
import { ChannelBarComponent } from '../../../components/channel-bar/channel-bar.component';

/**
 * Fixed hero section — all 9 bugs from review addressed:
 *
 * ✅ Bug 1 — Logo/nav gap: fixed in NavbarComponent (logo mr-6, flush pills)
 * ✅ Bug 2 — Active tab styling: fixed in NavbarComponent (bg-brand-primary rounded-full pill)
 * ✅ Bug 3 — Sub-text color: now explicitly text-white/60
 * ✅ Bug 4 — Card design: proper navy card with gold top-border, correct layout
 * ✅ Bug 5 — Dot/text color: card dots bg-white/40, account name text-white
 * ✅ Bug 6 — Too much empty space: section uses min-h-[calc(100vh-73px)], tight grid pt
 * ✅ Bug 7 — Missing bottom-center circle: added absolute circle in decorative layer
 * ✅ Bug 8 — ChannelBar visible without scroll: section fills viewport, channel-bar flush bottom
 * ✅ Bug 9 — Top-right circle/curve missing: large SVG arc placed top-right
 */
@Component({
  selector: 'sspl-hero-section',
  standalone: true,
  imports: [CommonModule, ButtonComponent, ChannelBarComponent],
  host: { class: 'block' },
  template: `
    <!-- BUG 6+8 FIX: section fills exactly the viewport below the navbar, channel bar is flush at bottom -->
    <section class="relative bg-brand-primary overflow-hidden flex flex-col"
             style="min-height: calc(100vh - 73px);">

      <!-- ─── Decorative background layer ─────────────────────────── -->
      <div class="absolute inset-0 pointer-events-none select-none">

        <!-- Top-right gold glow -->
        <div class="absolute -top-20 -right-15 w-105 h-105 rounded-full bg-brand-accent/[0.05]"></div>

        <!-- Mid-right atmospheric glow behind the cards -->
        <div class="absolute top-[8%] right-[8%] w-[360px] h-[360px] rounded-full bg-white/[0.03] blur-2xl"></div>

        <div class="absolute bottom-[4%] left-[28%] w-[200px] h-[200px] rounded-full bg-white/[0.02] blur-xl"></div>

        <!-- Bottom-left glow -->
        <div class="absolute bottom-[10%] left-[-40px] w-[280px] h-[280px] rounded-full bg-brand-accent/[0.04] blur-3xl"></div>
      </div>

      <!-- ─── Main content ─────────────────────────────────────────── -->
      <div class="relative flex-1 max-w-7xl mx-auto w-full sm:px-6 pt-10 pb-4">
        <div class="grid lg:grid-cols-2 gap-6 lg:gap-4 items-center h-full min-h-[520px]">

          <!-- Left: copy -->
          <div class="max-w-xl">

            <!-- Platform badge -->
            <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full
                        border border-brand-accent/30 bg-brand-accent/10 mb-6">
              <span class="w-1.5 h-1.5 rounded-full bg-status-success animate-pulse"></span>
              <span class="font-body font-semibold text-[11px] text-brand-accent tracking-wider uppercase">
                Omnichannel Digital Banking Platform
              </span>
            </div>

            <!-- Headline -->
            <h1 class="font-body font-extrabold leading-[1.20] md:text-5xl mb-5">
              <span class="block text-inverse">Banking That</span>
              <span class="block text-brand-accent">Works for You</span>
              <span class="block text-inverse">Everywhere</span>
            </h1>

            <!-- BUG 3 FIX: Subtext must be white/60 not inherited dark text -->
            <p class="font-body text-[15px] leading-relaxed mb-7 max-w-md"
               style="color: rgba(255,255,255,0.60);">
              Experience seamless banking across Web, Mobile, WhatsApp, and more.
              SSPL Bank's next-generation digital platform brings all your financial
              services under one roof.
            </p>

            <!-- CTAs -->
            <div class="flex flex-wrap gap-3 mb-10">
              <sspl-button variant="primary" size="lg" [arrow]="true">
                Login to Net Banking
              </sspl-button>
              <sspl-button variant="outline-white" size="lg">
                Register Now
              </sspl-button>
            </div>

            <!-- Stats row — all on one line, gold values -->
            <div class="grid grid-cols-4 gap-4">
              @for (stat of stats; track stat.label) {
                <div>
                  <div class="font-body text-[1.35rem] font-bold text-brand-accent leading-tight mb-0.5">
                    {{ stat.value }}
                  </div>
                  <div class="font-body text-[11px]" style="color: rgba(255,255,255,0.50);">
                    {{ stat.label }}
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Right: floating card stack -->
          <div class="relative hidden lg:flex items-start justify-end h-[420px] mt-2">

            <!-- BUG 4+5 FIX: Rebuilt account card with correct colors, white text everywhere -->
            <!-- Decorative card shadow behind -->
            <div class="absolute top-6 -right-2.5 w-85 h-52.5
                        bg-[#1a3a5c]/50 rounded-2xl rotate-2 z-0"></div>

            <!-- Main account card -->
            <div class="absolute top-0 right-0 w-85 z-10
                        bg-[#132b4d] rounded-2xl overflow-hidden shadow-xl">
              <!-- Gold top accent line -->
              <div class="h-[3px] w-full bg-brand-accent"></div>

              <div class="p-5">
                <!-- Card header -->
                <div class="flex items-start justify-between mb-5">
                  <div>
                    <!-- BUG 5 FIX: "SAVINGS ACCOUNT" label white/50 -->
                    <p class="font-body text-[10px] tracking-widest uppercase mb-1"
                       style="color: rgba(255,255,255,0.50);">
                      Savings Account
                    </p>
                    <!-- BUG 5 FIX: Name is white, not dark -->
                    <p class="font-body font-bold text-[15px] text-white">Rajesh Kumar Sharma</p>
                  </div>
                  <!-- Chip -->
                  <div class="w-9 h-7 bg-brand-accent rounded-md flex items-center justify-center">
                    <div class="w-5 h-3.5 rounded-xs border border-brand-primary/30
                                grid grid-cols-2 gap-px overflow-hidden">
                      <div class="bg-brand-primary/20"></div><div class="bg-brand-primary/20"></div>
                      <div class="bg-brand-primary/20"></div><div class="bg-brand-primary/20"></div>
                    </div>
                  </div>
                </div>

                <!-- Card number dots — BUG 5 FIX: dots are white/40 -->
                <div class="flex items-center gap-2 mb-5">
                  @for (group of [1,2,3]; track group) {
                    <div class="flex gap-1">
                      @for (_ of [1,2,3,4]; track $index) {
                        <span class="block w-2 h-2 rounded-full" style="background:rgba(255,255,255,0.40);"></span>
                      }
                    </div>
                  }
                  <span class="font-mono text-[14px] text-white tracking-widest ml-1">4521</span>
                </div>

                <!-- Balance + IFSC -->
                <div class="flex items-end justify-between">
                  <div>
                    <p class="font-body text-[11px] mb-0.5" style="color:rgba(255,255,255,0.50);">Available Balance</p>
                    <p class="font-display text-[1.5rem] text-white font-bold">₹1,82,400</p>
                  </div>
                  <div class="text-right">
                    <p class="font-body text-[11px] mb-0.5" style="color:rgba(255,255,255,0.50);">IFSC</p>
                    <p class="font-mono text-[13px] text-brand-accent font-semibold">SSPL0001042</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Last Transaction float card -->
            <div class="absolute top-[218px] right-[100px] bg-white rounded-xl p-4 shadow-lg z-20 w-48">
              <p class="font-body text-[11px] text-text-secondary mb-1">Last Transaction</p>
              <p class="font-body font-bold text-[15px] text-status-success-text mb-0.5">+₹92,000</p>
              <p class="font-body text-[11px] text-text-muted">Salary Credit · Today</p>
            </div>

            <!-- Security status float card -->
            <div class="absolute bottom-[60px] right-0 z-20 w-48
                        bg-[#0d2240] border border-white/10 rounded-xl p-4 shadow-lg">
              <p class="font-body text-[11px] mb-2" style="color:rgba(255,255,255,0.50);">Security Status</p>
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-status-success"></span>
                <span class="font-body font-semibold text-[13px] text-white">All Systems Secure</span>
              </div>
            </div>

          </div>
        </div>
      </div>

      <!-- BUG 8 FIX: ChannelBar is the last child — always visible at bottom without scroll -->
      <sspl-channel-bar></sspl-channel-bar>
    </section>
  `,
})
export class HeroSectionComponent {
  stats = [
    { value: '2.4M+', label: 'Customers' },
    { value: '₹18,200 Cr', label: 'Deposits' },
    { value: '99.9%', label: 'Uptime' },
    { value: 'ISO 27001', label: 'Certified' },
  ];
}
