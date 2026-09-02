import { Component, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LoanService } from '../../services/loan.service';
import { LoanApplicationSummary } from '../../models';

@Component({
  selector: 'sspl-loan-applications-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loan-applications-list.component.html',
  styleUrl: './loan-applications-list.component.scss',
})
export class LoanApplicationsListComponent {
  private loanService = inject(LoanService);
  private router = inject(Router);

  // Optional custom input list; defaults to loanService.loanApplications
  customApplications = input<LoanApplicationSummary[] | null>(null);
  title = input<string>('Ongoing Loans & Active Applications');
  subtitle = input<string>(
    'Monitor your drafted applications, underwriting submissions, and active credit facilities.',
  );
  showManageHubLink = input<boolean>(true);

  // Read applications from signal or custom input
  get applications(): LoanApplicationSummary[] {
    const custom = this.customApplications();
    if (custom !== null && custom !== undefined) {
      return custom;
    }
    return this.loanService.loanApplications();
  }

  // Events
  resumeApplication = output<LoanApplicationSummary>();
  trackStatus = output<LoanApplicationSummary>();
  payEmi = output<LoanApplicationSummary>();

  // State
  copiedRef = signal<string | null>(null);
  trackingApplication = signal<LoanApplicationSummary | null>(null);
  toast = signal<string | null>(null);

  formatInr(amount: number | null | undefined): string {
    if (amount === null || amount === undefined || isNaN(amount)) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  }

  formatDate(timestamp: number | null | undefined): string {
    if (!timestamp) return 'Recently';
    const date = new Date(timestamp);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    const timeStr = date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    if (isToday) {
      return `Today, ${timeStr}`;
    }
    return `${date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}, ${timeStr}`;
  }

  copyReference(ref: string, event: Event): void {
    event.stopPropagation();
    if (!ref) return;
    navigator.clipboard.writeText(ref).then(() => {
      this.copiedRef.set(ref);
      setTimeout(() => {
        if (this.copiedRef() === ref) {
          this.copiedRef.set(null);
        }
      }, 2000);
    });
  }

  onActionClick(app: LoanApplicationSummary): void {
    if (app.applicationStatus === 'DRAFT') {
      // Emit to parent (e.g. loans-page)
      this.resumeApplication.emit(app);

      // If currently on dashboard or other route, navigate to loans with reference
      if (!this.router.url.includes('/loans')) {
        this.router.navigate(['/loans'], {
          queryParams: {
            ref: app.applicationReference,
            section: app.currentSection,
            product: app.productCode,
          },
        });
      }
    } else if (app.applicationStatus === 'SUBMITTED') {
      this.trackStatus.emit(app);
      this.trackingApplication.set(app);
    } else if (
      app.applicationStatus === 'APPROVED' ||
      app.applicationStatus === 'DISBURSED' ||
      app.applicationStatus === 'ONGOING'
    ) {
      this.payEmi.emit(app);
      this.showTemporaryToast(`Initiating quick EMI payment for ${app.applicationReference}...`);
    } else {
      this.showTemporaryToast(`Opening details for ${app.applicationReference}...`);
    }
  }

  closeTrackingModal(): void {
    this.trackingApplication.set(null);
  }

  showTemporaryToast(msg: string): void {
    this.toast.set(msg);
    setTimeout(() => {
      if (this.toast() === msg) {
        this.toast.set(null);
      }
    }, 3000);
  }

  navigateToLoansHub(): void {
    this.router.navigate(['/loans']);
  }

  getActionLabel(app: LoanApplicationSummary): string {
    if (app.applicationStatus === 'DRAFT') {
      if (app.currentSection === 'REVIEW') {
        return 'Review & Disburse';
      }
      if (app.currentSection === 'LOAN_REQUIREMENT') {
        return 'Customise Loan';
      }
      if (app.currentSection === 'PERSONAL_DETAILS') {
        return 'Complete Details';
      }
      return 'Resume Application';
    }
    if (app.applicationStatus === 'SUBMITTED') {
      return 'Track Status';
    }
    if (
      app.applicationStatus === 'APPROVED' ||
      app.applicationStatus === 'DISBURSED' ||
      app.applicationStatus === 'ONGOING'
    ) {
      return 'Pay EMI';
    }
    if (app.applicationStatus === 'REJECTED') {
      return 'Re-apply';
    }
    return 'View Details';
  }

  getStateTitle(app: LoanApplicationSummary): string {
    if (app.applicationStatus === 'DRAFT') {
      if (app.currentSection === 'REVIEW') {
        return 'Step 5 · Sanction & Disbursal Review';
      }
      if (app.currentSection === 'LOAN_REQUIREMENT') {
        return 'Step 2 · Customise Loan & Quote';
      }
      if (app.currentSection === 'PERSONAL_DETAILS') {
        return 'Step 1 · Personal Details Form';
      }
      return `Draft In-Progress (${app.currentSection || 'Step 1'})`;
    }
    if (app.applicationStatus === 'SUBMITTED') {
      return 'Underwriting & Verification in Progress';
    }
    if (
      app.applicationStatus === 'APPROVED' ||
      app.applicationStatus === 'DISBURSED' ||
      app.applicationStatus === 'ONGOING'
    ) {
      return 'Disbursed · Active Repayment';
    }
    if (app.applicationStatus === 'REJECTED') {
      return 'Eligibility Criteria Not Met';
    }
    return app.statusDisplayName || 'Processing';
  }

  getStateDescription(app: LoanApplicationSummary): string {
    if (app.applicationStatus === 'DRAFT') {
      if (app.currentSection === 'REVIEW') {
        return 'Personal details & requirement saved. Review sanction letter terms to complete immediate disbursement.';
      }
      if (app.currentSection === 'LOAN_REQUIREMENT') {
        return 'Personal details verified. Adjust loan amount and tenure to calculate your live quote.';
      }
      if (app.currentSection === 'PERSONAL_DETAILS') {
        return 'Enter mandatory applicant and contact details to begin your loan journey.';
      }
      return 'Application saved as draft. Click below to continue where you left off.';
    }
    if (app.applicationStatus === 'SUBMITTED') {
      return 'Your digital application is being appraised by credit underwriting. Sanction decision expected within 2 business hours.';
    }
    if (
      app.applicationStatus === 'APPROVED' ||
      app.applicationStatus === 'DISBURSED' ||
      app.applicationStatus === 'ONGOING'
    ) {
      return `Facility active. Auto-debit linked to account ${app.maskedCreditAccount || 'XXXXXXXX0001'}.`;
    }
    if (app.applicationStatus === 'REJECTED') {
      return 'Application could not be approved at this time. Please contact your branch for personalized assistance.';
    }
    return 'Your loan facility is in active status.';
  }
}
