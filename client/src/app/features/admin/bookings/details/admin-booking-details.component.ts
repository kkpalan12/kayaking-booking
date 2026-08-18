import { CommonModule } from '@angular/common';

import { Component, inject, OnInit } from '@angular/core';

import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { BookingService } from '../../../../core/services/booking.service';

import { Booking } from '../../../../core/models/booking.model';
import { AdminNavComponent } from '../../shared/navigation/admin-nav.component';

@Component({
  selector: 'app-admin-booking-details',
  standalone: true,
  imports: [CommonModule, RouterLink, AdminNavComponent],
  templateUrl: './admin-booking-details.component.html',
  styleUrl: './admin-booking-details.component.scss',
})
export class AdminBookingDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);

  private readonly router = inject(Router);

  private readonly bookingService = inject(BookingService);

  booking: Booking | null = null;

  loading = true;

  submitting = false;

  error = '';

  successMessage = '';

  ngOnInit(): void {
    const bookingId = this.route.snapshot.paramMap.get('bookingId');

    if (!bookingId) {
      this.router.navigate(['/admin']);
      return;
    }

    this.loadBooking(bookingId);
  }

  loadBooking(bookingId: string): void {
    this.loading = true;

    this.error = '';

    this.bookingService.getBooking(bookingId).subscribe({
      next: (booking) => {
        this.booking = booking;
        this.loading = false;
      },

      error: (error) => {
        console.error('Failed to load booking:', error);

        this.error = error?.error?.message || 'Unable to load booking.';

        this.loading = false;
      },
    });
  }

  cancelBooking(): void {
    if (!this.booking || this.submitting) {
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to cancel this booking?',
    );

    if (!confirmed) {
      return;
    }

    this.updateStatus('CANCELLED');
  }

  private updateStatus(status: 'CANCELLED'): void {
    if (!this.booking || this.submitting) {
      return;
    }

    this.submitting = true;

    this.error = '';

    this.successMessage = '';

    this.bookingService
      .updateBookingStatus(this.booking.bookingId, status)
      .subscribe({
        next: (booking) => {
          this.booking = booking;

          this.submitting = false;

          this.successMessage = 'Booking cancelled successfully.';
        },

        error: (error) => {
          console.error('Failed to update booking:', error);

          this.submitting = false;

          this.error = error?.error?.message || 'Unable to update booking.';
        },
      });
  }

  formatDate(value: string | Date): string {
    return new Intl.DateTimeFormat('en-IN', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date(value));
  }

  formatCreatedDate(value: string | Date): string {
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  }

  get whatsappUrl(): string {
    if (!this.booking) {
      return '';
    }

    const phone = this.booking.customerPhone.replace(/\D/g, '');

    const message =
      `Hello ${this.booking.customerName}, ` +
      `this is River Edge regarding your ` +
      `booking ${this.booking.bookingId}.`;

    return `https://wa.me/91${phone}` + `?text=${encodeURIComponent(message)}`;
  }
  simulateFailedPayment(): void {
    if (!this.booking || this.submitting) {
      return;
    }

    const confirmed = window.confirm(
      'Simulate a failed payment for this booking?',
    );

    if (!confirmed) {
      return;
    }

    this.submitting = true;

    this.error = '';

    this.successMessage = '';

    this.bookingService
      .simulateTestFailedPayment(this.booking.bookingId)
      .subscribe({
        next: (booking) => {
          this.booking = booking;

          this.submitting = false;

          this.successMessage =
            'Test failed payment simulated. Booking remains pending.';
        },

        error: (error) => {
          console.error('Failed to simulate payment:', error);

          this.submitting = false;

          this.error =
            error?.error?.message || 'Unable to simulate failed payment.';
        },
      });
  }
  simulateSuccessfulPayment(): void {
    if (!this.booking || this.submitting) {
      return;
    }

    const confirmed = window.confirm(
      'Simulate a successful payment for this booking?',
    );

    if (!confirmed) {
      return;
    }

    this.submitting = true;
    this.error = '';
    this.successMessage = '';

    this.bookingService.simulateTestPayment(this.booking.bookingId).subscribe({
      next: (booking) => {
        this.booking = booking;

        this.submitting = false;

        this.successMessage =
          'Test payment simulated successfully. Booking confirmed.';
      },

      error: (error) => {
        console.error('Failed to simulate successful payment:', error);

        this.submitting = false;

        this.error =
          error?.error?.message || 'Unable to simulate successful payment.';
      },
    });
  }
}
