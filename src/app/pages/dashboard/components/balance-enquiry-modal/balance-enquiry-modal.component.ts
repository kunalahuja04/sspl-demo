import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BankAccount } from '../../../../services/dashboard.service';

@Component({
  selector: 'sspl-balance-enquiry-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './balance-enquiry-modal.component.html',
  styleUrl: './balance-enquiry-modal.component.scss'
})
export class BalanceEnquiryModalComponent {
  account = input<BankAccount | null>(null);

  close = output<void>();
  downloadStatement = output<string>();

  onClose(): void {
    this.close.emit();
  }

  onDownload(format: string): void {
    this.downloadStatement.emit(format);
  }
}
