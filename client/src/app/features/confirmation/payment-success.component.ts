import { DatePipe } from '@angular/common';

import { Component, OnDestroy, OnInit, inject } from '@angular/core';

import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import {
  Subscription,
  interval,
  switchMap,
  startWith,
  catchError,
  of,
} from 'rxjs';

import { BookingService } from '../../core/services/booking.service';
import { Booking } from '../../core/models/booking.model';

type PaymentPageState =
  | 'LOADING'
  | 'PROCESSING'
  | 'SUCCESS'
  | 'FAILED'
  | 'NOT_FOUND'
  | 'ERROR';

@Component({
  selector: 'app-payment-success',
  standalone: true,

  imports: [RouterLink],

  templateUrl: './payment-success.component.html',

  styleUrl: './payment-success.component.scss',
})
export class PaymentSuccessComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);

  private readonly router = inject(Router);

  private readonly bookingService = inject(BookingService);

  private pollingSubscription?: Subscription;

  bookingId = '';

  booking?: Booking;

  state: PaymentPageState = 'LOADING';

  errorMessage = '';
  retryingPayment = false;

  ngOnInit(): void {
    this.bookingId =
      this.route.snapshot.queryParamMap.get(
        'razorpay_payment_link_reference_id',
      ) ||
      this.route.snapshot.queryParamMap.get('bookingId') ||
      '';

    if (!this.bookingId) {
      this.state = 'NOT_FOUND';

      return;
    }

    this.startBookingStatusCheck();
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  private startBookingStatusCheck(): void {
    this.stopPolling();

    /*
     * Check immediately, then every 3 seconds.
     *
     * Razorpay redirect can happen before our
     * webhook has finished processing.
     */
    this.pollingSubscription = interval(3000)
      .pipe(
        startWith(0),

        switchMap(() =>
          this.bookingService.getBookingById(this.bookingId).pipe(
            catchError((error) => {
              console.error('Booking status check failed:', error);

              return of(null);
            }),
          ),
        ),
      )
      .subscribe({
        next: (booking) => {
          if (!booking) {
            /*
             * Don't immediately show an error.
             *
             * The webhook may still be processing.
             */
            if (this.state === 'LOADING') {
              this.state = 'PROCESSING';
            }

            return;
          }

          this.booking = booking;

          this.updateState(booking);
        },

        error: (error) => {
          console.error('Payment status polling error:', error);

          this.state = 'ERROR';

          this.errorMessage = 'We could not verify your booking status.';
        },
      });
  }

  private updateState(booking: Booking): void {
    if (booking.paymentStatus === 'PAID') {
      this.state = 'SUCCESS';

      this.stopPolling();

      return;
    }

    if (booking.paymentStatus === 'FAILED') {
      this.state = 'FAILED';

      this.stopPolling();

      return;
    }

    /*
     * PENDING means Razorpay may have redirected
     * before the webhook completed.
     */
    this.state = 'PROCESSING';
  }

  private stopPolling(): void {
    this.pollingSubscription?.unsubscribe();

    this.pollingSubscription = undefined;
  }

  retryPayment(): void {
    if (!this.bookingId || this.retryingPayment) {
      return;
    }

    this.retryingPayment = true;

    this.bookingService.retryPayment(this.bookingId).subscribe({
      next: (payment) => {
        this.retryingPayment = false;

        if (payment?.paymentUrl) {
          window.location.href = payment.paymentUrl;

          return;
        }

        this.errorMessage = 'Unable to start payment again.';

        this.state = 'ERROR';
      },

      error: (error) => {
        console.error('Retry payment failed:', error);

        this.retryingPayment = false;

        this.errorMessage =
          error?.error?.message ||
          'Unable to restart payment. Please try again.';
      },
    });
  }

  get isSuccess(): boolean {
    return this.state === 'SUCCESS';
  }

  get isProcessing(): boolean {
    return this.state === 'PROCESSING' || this.state === 'LOADING';
  }

  get isFailed(): boolean {
    return this.state === 'FAILED';
  }

  get isError(): boolean {
    return this.state === 'ERROR' || this.state === 'NOT_FOUND';
  }
  formatDate(value: string | Date): string {
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(value));
  }
}
