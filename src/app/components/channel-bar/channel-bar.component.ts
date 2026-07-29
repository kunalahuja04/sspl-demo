import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Channel {
  icon: string;
  label: string;
}

@Component({
  selector: 'sspl-channel-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-brand-accent w-full">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-center gap-8 md:gap-12 py-4 overflow-x-auto">
          @for(channel of channels; track $index) {
            <div class="flex items-center gap-2.5 text-brand-primary whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity">
              <span class="text-xl">{{ channel.icon }}</span>
              <span class="font-body font-semibold text-body-md">{{ channel.label }}</span>
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class ChannelBarComponent {
  channels: Channel[] = [
    { icon: '🌐', label: 'Net Banking' },
    { icon: '📱', label: 'Mobile App' },
    { icon: '💬', label: 'WhatsApp Banking' },
    { icon: '🏧', label: 'ATM / Branch' },
    { icon: '☎️', label: 'Phone Banking' },
    { icon: '🖥️', label: 'Kiosk Banking' },
  ];
}