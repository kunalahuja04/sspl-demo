import { Component, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'sspl-export-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './export-modal.component.html',
  styleUrl: './export-modal.component.scss'
})
export class ExportModalComponent {
  close = output<void>();
  download = output<string>();

  onClose(): void {
    this.close.emit();
  }

  onDownload(format: string): void {
    this.download.emit(format);
  }
}
