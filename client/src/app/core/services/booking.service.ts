import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';

import {
  Booking,
  BookingStatus,
  CreateBookingRequest,
  PaymentLink,
} from '../models/booking.model';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class BookingService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = environment.apiUrl;

  /**
   * Create customer booking.
   *
   * Public endpoint.
   */
  createBooking(request: CreateBookingRequest): Observable<Booking> {
    return this.http
      .post<ApiResponse<Booking>>(`${this.apiUrl}/bookings`, request)
      .pipe(map((response) => response.data));
  }

  /**
   * Create Razorpay payment link.
   *
   * Public endpoint.
   */
  createPaymentLink(bookingId: string): Observable<PaymentLink> {
    return this.http
      .post<
        ApiResponse<PaymentLink>
      >(`${this.apiUrl}/payments/link/${bookingId}`, {})
      .pipe(map((response) => response.data));
  }

  /**
   * Get all bookings.
   *
   * Admin only.
   */
  getBookings(): Observable<Booking[]> {
    return this.http
      .get<ApiResponse<Booking[]>>(`${this.apiUrl}/bookings`, {
        withCredentials: true,
      })
      .pipe(map((response) => response.data));
  }

  /**
   * Get one booking.
   *
   * Admin only.
   */
  getBooking(bookingId: string): Observable<Booking> {
    return this.http
      .get<ApiResponse<Booking>>(`${this.apiUrl}/bookings/${bookingId}`, {
        withCredentials: true,
      })
      .pipe(map((response) => response.data));
  }

  getBookingById(bookingId: string): Observable<Booking> {
    return this.http
      .get<
        ApiResponse<Booking>
      >(`${this.apiUrl}/payments/status/${encodeURIComponent(bookingId)}`)
      .pipe(map((response) => response.data));
  }

  /**
   * Update booking status.
   *
   * Manual admin action currently supports
   * cancellation only.
   *
   * Successful Razorpay payment automatically
   * changes the booking to CONFIRMED on the backend.
   */
  updateBookingStatus(
    bookingId: string,
    status: BookingStatus,
  ): Observable<Booking> {
    return this.http
      .patch<ApiResponse<Booking>>(
        `${this.apiUrl}/bookings/${bookingId}/status`,
        {
          status,
        },
        {
          withCredentials: true,
        },
      )
      .pipe(map((response) => response.data));
  }

  retryPayment(bookingId: string): Observable<PaymentLink> {
    return this.http
      .post<ApiResponse<PaymentLink>>(
        `${environment.apiUrl}/payments/link/${encodeURIComponent(bookingId)}`,
        {},
        {
          withCredentials: true,
        },
      )
      .pipe(map((response) => response.data));
  }
  simulateTestFailedPayment(bookingId: string): Observable<Booking> {
    return this.http
      .post<ApiResponse<Booking>>(
        `${environment.apiUrl}/payments/test-failed/${encodeURIComponent(bookingId)}`,
        {},
        {
          withCredentials: true,
        },
      )
      .pipe(map((response) => response.data));
  }
  simulateTestPayment(bookingId: string): Observable<Booking> {
    return this.http
      .post<ApiResponse<Booking>>(
        `${environment.apiUrl}/payments/test/${encodeURIComponent(bookingId)}`,
        {},
        {
          withCredentials: true,
        },
      )
      .pipe(map((response) => response.data));
  }
}
