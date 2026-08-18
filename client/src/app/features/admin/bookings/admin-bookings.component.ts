import { CommonModule } from '@angular/common';

import { Component, inject, OnInit } from '@angular/core';

import { Router } from '@angular/router';

import { BookingService } from '../../../core/services/booking.service';

import { Booking } from '../../../core/models/booking.model';
import { AdminNavComponent } from '../shared/navigation/admin-nav.component';

type BookingStatus = 'ALL' | 'PENDING' | 'CONFIRMED' | 'CANCELLED';

type PaymentStatus = 'ALL' | 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

type DateFilter = 'ALL' | 'TODAY' | 'TOMORROW' | 'THIS_WEEK' | 'CUSTOM';

@Component({
  selector: 'app-admin-bookings',
  standalone: true,
  imports: [CommonModule, AdminNavComponent],
  templateUrl: './admin-bookings.component.html',
  styleUrl: './admin-bookings.component.scss',
})
export class AdminBookingsComponent implements OnInit {
  private readonly bookingService = inject(BookingService);

  private readonly router = inject(Router);

  bookings: Booking[] = [];

  loading = true;

  error = '';

  searchTerm = '';

  bookingStatus: BookingStatus = 'ALL';

  paymentStatus: PaymentStatus = 'ALL';

  dateFilter: DateFilter = 'ALL';

  customDate = '';

  pageSize = 10;

  currentPage = 1;

  ngOnInit(): void {
    this.loadBookings();
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

        this.currentPage = 1;

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

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredBookings.length / this.pageSize));
  }

  get paginatedBookings(): Booking[] {
    const start = (this.currentPage - 1) * this.pageSize;

    return this.filteredBookings.slice(start, start + this.pageSize);
  }

  get pageStart(): number {
    if (this.filteredBookings.length === 0) {
      return 0;
    }

    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get pageEnd(): number {
    return Math.min(
      this.currentPage * this.pageSize,
      this.filteredBookings.length,
    );
  }

  setPage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }

    this.currentPage = page;
  }

  previousPage(): void {
    this.setPage(this.currentPage - 1);
  }

  nextPage(): void {
    this.setPage(this.currentPage + 1);
  }

  setBookingStatus(status: string): void {
    this.bookingStatus = status as BookingStatus;

    this.currentPage = 1;
  }

  setPaymentStatus(status: string): void {
    this.paymentStatus = status as PaymentStatus;

    this.currentPage = 1;
  }

  setDateFilter(filter: string): void {
    this.dateFilter = filter as DateFilter;

    if (this.dateFilter !== 'CUSTOM') {
      this.customDate = '';
    }

    this.currentPage = 1;
  }

  setCustomDate(value: string): void {
    this.customDate = value;

    this.dateFilter = 'CUSTOM';

    this.currentPage = 1;
  }

  onSearch(value: string): void {
    this.searchTerm = value;

    this.currentPage = 1;
  }

  clearFilters(): void {
    this.searchTerm = '';

    this.bookingStatus = 'ALL';

    this.paymentStatus = 'ALL';

    this.dateFilter = 'ALL';

    this.customDate = '';

    this.currentPage = 1;
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
