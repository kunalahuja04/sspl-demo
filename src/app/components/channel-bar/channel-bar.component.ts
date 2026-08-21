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
  templateUrl: './channel-bar.component.html',
  styleUrl: './channel-bar.component.scss',
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