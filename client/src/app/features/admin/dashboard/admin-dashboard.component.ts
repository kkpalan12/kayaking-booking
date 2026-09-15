import { CommonModule } from '@angular/common';

import { Component, inject, OnInit } from '@angular/core';

import { Router } from '@angular/router';

import { BookingService } from '../../../core/services/booking.service';

import { AdminAuthService } from '../../../core/services/admin-auth.service';

import { Booking } from '../../../core/models/booking.model';
import { AdminNavComponent } from '../shared/navigation/admin-nav.component';

type BookingStatus = 'ALL' | 'PENDING' | 'CONFIRMED' | 'CANCELLED';

type PaymentStatus = 'ALL' | 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

type DateFilter = 'ALL' | 'TODAY' | 'TOMORROW' | 'THIS_WEEK' | 'CUSTOM';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, AdminNavComponent],
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

  dateFilter: DateFilter = 'ALL';

  customDate = '';

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

  openBooking(bookingId: string): void {
    this.router.navigate(['/admin/bookings', bookingId]);
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

      const matchesDate = this.matchesDateFilter(new Date(booking.bookingDate));

      return (
        matchesSearch &&
        matchesBookingStatus &&
        matchesPaymentStatus &&
        matchesDate
      );
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
    return this.bookings.filter(
      (booking) =>
        this.dateKey(new Date(booking.bookingDate)) ===
        this.dateKey(new Date()),
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

  setDateFilter(filter: string): void {
    this.dateFilter = filter as DateFilter;

    if (this.dateFilter !== 'CUSTOM') {
      this.customDate = '';
    }
  }

  setCustomDate(value: string): void {
    this.customDate = value;

    this.dateFilter = 'CUSTOM';
  }

  clearFilters(): void {
    this.searchTerm = '';

    this.bookingStatus = 'ALL';

    this.paymentStatus = 'ALL';

    this.dateFilter = 'ALL';

    this.customDate = '';
  }

  exportCsv(): void {
    const rows = this.filteredBookings;

    if (!rows.length) {
      return;
    }

    const headers = [
      'Booking ID',
      'Customer',
      'Phone',
      'Package',
      'Date',
      'Time',
      'Quantity',
      'Pricing Type',
      'Unit Price',
      'Subtotal',
      'Discount',
      'Total',
      'Payment Status',
      'Booking Status',
      'Created At',
    ];

    const csvRows = rows.map((booking) => [
      booking.bookingId,
      booking.customerName,
      booking.customerPhone,
      booking.packageName,
      this.formatDateForCsv(booking.bookingDate),
      booking.timeSlot,
      booking.quantity,
      booking.pricingType,
      booking.unitPrice,
      booking.subtotal,
      booking.discountAmount,
      booking.totalAmount,
      booking.paymentStatus,
      booking.bookingStatus,
      this.formatDateTimeForCsv(booking.createdAt),
    ]);

    const csv = [headers, ...csvRows]
      .map((row) => row.map((value) => this.csvEscape(value)).join(','))
      .join('\r\n');

    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');

    const stamp = new Date().toISOString().slice(0, 10);

    link.href = url;

    link.download = `river-edge-bookings-${stamp}.csv`;

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);
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

  private matchesDateFilter(bookingDate: Date): boolean {
    switch (this.dateFilter) {
      case 'TODAY':
        return this.dateKey(bookingDate) === this.dateKey(new Date());

      case 'TOMORROW':
        return (
          this.dateKey(bookingDate) ===
          this.dateKey(this.addDays(new Date(), 1))
        );

      case 'THIS_WEEK': {
        const start = this.startOfToday();

        const day = start.getDay();

        const diff = day === 0 ? -6 : 1 - day;

        const monday = this.addDays(start, diff);

        const sunday = this.addDays(monday, 6);

        return bookingDate >= monday && bookingDate <= this.endOfDay(sunday);
      }

      case 'CUSTOM':
        return (
          !!this.customDate && this.dateKey(bookingDate) === this.customDate
        );

      case 'ALL':
      default:
        return true;
    }
  }

  private startOfToday(): Date {
    const date = new Date();

    date.setHours(0, 0, 0, 0);

    return date;
  }

  private endOfDay(date: Date): Date {
    const result = new Date(date);

    result.setHours(23, 59, 59, 999);

    return result;
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date);

    result.setDate(result.getDate() + days);

    return result;
  }

  private dateKey(date: Date): string {
    return [
      date.getFullYear(),

      String(date.getMonth() + 1).padStart(2, '0'),

      String(date.getDate()).padStart(2, '0'),
    ].join('-');
  }

  private formatDateForCsv(value: string | Date): string {
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(value));
  }

  private formatDateTimeForCsv(value: string | Date): string {
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  }

  private csvEscape(value: unknown): string {
    const text = String(value ?? '');

    return `"${text.replace(/"/g, '""')}"`;
  }
}
