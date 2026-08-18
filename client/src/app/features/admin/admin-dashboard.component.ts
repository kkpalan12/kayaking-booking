import { CommonModule } from '@angular/common';

import { Component, inject, OnInit } from '@angular/core';

import { Router } from '@angular/router';

import { BookingService } from '../../core/services/booking.service';

import { AdminAuthService } from '../../core/services/admin-auth.service';

import { Booking } from '../../core/models/booking.model';

type BookingStatus = 'ALL' | 'PENDING' | 'CONFIRMED' | 'CANCELLED';

type PaymentStatus = 'ALL' | 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
})
export class AdminDashboardComponent implements OnInit {
  private readonly bookingService = inject(BookingService);

  private readonly adminAuthService = inject(AdminAuthService);

  private readonly router = inject(Router);

  bookings: Booking[] = [];

  loading = true;

  error = '';

  searchTerm = '';

  bookingStatus: BookingStatus = 'ALL';

  paymentStatus: PaymentStatus = 'ALL';

  adminEmail = '';

  ngOnInit(): void {
    this.loadAdminSession();

    this.loadBookings();
  }

  loadAdminSession(): void {
    this.adminAuthService.me().subscribe({
      next: (admin) => {
        this.adminEmail = admin.email;
      },

      error: (error) => {
        console.error('Failed to load admin session', error);
      },
    });
  }

  loadBookings(): void {
    this.loading = true;

    this.error = '';

    this.bookingService.getBookings().subscribe({
      next: (bookings) => {
        this.bookings = [...bookings].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );

        this.loading = false;
      },

      error: (error) => {
        console.error('Failed to load bookings', error);

        this.error = error?.error?.message || 'Unable to load bookings.';

        this.loading = false;
      },
    });
  }

  logout(): void {
    this.adminAuthService.logout().subscribe({
      next: () => {
        this.router.navigate(['/admin/login']);
      },

      error: (error) => {
        console.error('Admin logout failed', error);

        this.router.navigate(['/admin/login']);
      },
    });
  }

  get filteredBookings(): Booking[] {
    const search = this.searchTerm.trim().toLowerCase();

    return this.bookings.filter((booking) => {
      const matchesSearch =
        !search ||
        booking.bookingId.toLowerCase().includes(search) ||
        booking.customerName.toLowerCase().includes(search) ||
        booking.customerPhone.toLowerCase().includes(search) ||
        booking.packageName.toLowerCase().includes(search);

      const matchesBookingStatus =
        this.bookingStatus === 'ALL' ||
        booking.bookingStatus === this.bookingStatus;

      const matchesPaymentStatus =
        this.paymentStatus === 'ALL' ||
        booking.paymentStatus === this.paymentStatus;

      return matchesSearch && matchesBookingStatus && matchesPaymentStatus;
    });
  }

  get totalBookings(): number {
    return this.bookings.length;
  }

  get paidBookings(): number {
    return this.bookings.filter((booking) => booking.paymentStatus === 'PAID')
      .length;
  }

  get pendingPayments(): number {
    return this.bookings.filter(
      (booking) => booking.paymentStatus === 'PENDING',
    ).length;
  }

  get confirmedBookings(): number {
    return this.bookings.filter(
      (booking) => booking.bookingStatus === 'CONFIRMED',
    ).length;
  }

  get pendingBookings(): number {
    return this.bookings.filter(
      (booking) => booking.bookingStatus === 'PENDING',
    ).length;
  }

  get cancelledBookings(): number {
    return this.bookings.filter(
      (booking) => booking.bookingStatus === 'CANCELLED',
    ).length;
  }

  get paidRevenue(): number {
    return this.bookings
      .filter((booking) => booking.paymentStatus === 'PAID')
      .reduce((total, booking) => total + Number(booking.totalAmount || 0), 0);
  }

  get todayBookings(): number {
    const today = this.dateKey(new Date());

    return this.bookings.filter(
      (booking) => this.dateKey(new Date(booking.bookingDate)) === today,
    ).length;
  }

  get upcomingBookings(): number {
    const today = this.startOfToday().getTime();

    return this.bookings.filter((booking) => {
      const date = new Date(booking.bookingDate).getTime();

      return date >= today && booking.bookingStatus !== 'CANCELLED';
    }).length;
  }

  get recentBookings(): Booking[] {
    return this.filteredBookings.slice(0, 10);
  }

  setBookingStatus(status: string): void {
    this.bookingStatus = status as BookingStatus;
  }

  setPaymentStatus(status: string): void {
    this.paymentStatus = status as PaymentStatus;
  }

  clearFilters(): void {
    this.searchTerm = '';

    this.bookingStatus = 'ALL';

    this.paymentStatus = 'ALL';
  }

  formatDate(value: string | Date): string {
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(value));
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  }

  private startOfToday(): Date {
    const date = new Date();

    date.setHours(0, 0, 0, 0);

    return date;
  }

  private dateKey(date: Date): string {
    return [
      date.getFullYear(),

      String(date.getMonth() + 1).padStart(2, '0'),

      String(date.getDate()).padStart(2, '0'),
    ].join('-');
  }
  openBooking(bookingId: string): void {
    this.router.navigate(['/admin/bookings', bookingId]);
  }
}
