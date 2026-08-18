import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';

import {
  Booking,
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

  private readonly apiUrl = `${environment.apiUrl}`;

  createBooking(request: CreateBookingRequest): Observable<Booking> {
    return this.http
      .post<ApiResponse<Booking>>(`${this.apiUrl}/bookings`, request)
      .pipe(map((response) => response.data));
  }

  createPaymentLink(bookingId: string): Observable<PaymentLink> {
    return this.http
      .post<
        ApiResponse<PaymentLink>
      >(`${this.apiUrl}/payments/link/${bookingId}`, {})
      .pipe(map((response) => response.data));
  }
}
