import { Component, inject, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';

import { ActivatedRoute, Router } from '@angular/router';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { PackageService } from '../../core/services/package.service';

import { BookingService } from '../../core/services/booking.service';

import { KayakingPackage } from '../../core/models/package.model';

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './booking.component.html',
  styleUrl: './booking.component.scss',
})
export class BookingComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);

  private readonly router = inject(Router);

  private readonly fb = inject(FormBuilder);

  private readonly packageService = inject(PackageService);

  private readonly bookingService = inject(BookingService);

  packageData!: KayakingPackage;

  loading = true;

  submitting = false;

  errorMessage = '';

  minDate = new Date().toISOString().split('T')[0];

  timeSlots = [
    '06:00 AM',
    '07:00 AM',
    '08:00 AM',
    '09:00 AM',
    '10:00 AM',
    '04:00 PM',
    '05:00 PM',
    '06:00 PM',
  ];

  bookingForm = this.fb.group({
    bookingDate: [this.minDate, Validators.required],

    timeSlot: ['07:00 AM', Validators.required],

    quantity: [1, [Validators.required, Validators.min(1), Validators.max(50)]],

    customerName: ['', [Validators.required, Validators.minLength(2)]],

    customerPhone: [
      '',
      [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)],
    ],
  });

  ngOnInit(): void {
    const packageId = this.route.snapshot.paramMap.get('id');

    if (!packageId) {
      this.router.navigate(['/']);
      return;
    }

    this.packageService.getPackages().subscribe({
      next: (packages) => {
        const selected = packages.find((item) => item._id === packageId);

        if (!selected) {
          this.router.navigate(['/']);
          return;
        }

        this.packageData = selected;
        this.loading = false;
      },

      error: () => {
        this.errorMessage = 'Unable to load this experience.';

        this.loading = false;
      },
    });
  }

  get quantity(): number {
    return Number(this.bookingForm.controls.quantity.value || 1);
  }

  get subtotal(): number {
    if (!this.packageData) {
      return 0;
    }

    return this.packageData.pricingType === 'PER_PERSON'
      ? this.packageData.price * this.quantity
      : this.packageData.price;
  }

  get discountAmount(): number {
    if (!this.packageData || !this.packageData.discount?.enabled) {
      return 0;
    }

    const discount = this.packageData.discount;

    if (discount.type === 'PERCENTAGE') {
      return Math.round((this.subtotal * discount.value) / 100);
    }

    return Math.min(discount.value, this.subtotal);
  }

  get total(): number {
    return Math.max(0, this.subtotal - this.discountAmount);
  }

  increaseQuantity(): void {
    const current = this.quantity;

    if (current < 50) {
      this.bookingForm.controls.quantity.setValue(current + 1);
    }
  }

  decreaseQuantity(): void {
    const current = this.quantity;

    if (current > 1) {
      this.bookingForm.controls.quantity.setValue(current - 1);
    }
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  payNow(): void {
    if (this.bookingForm.invalid || this.submitting) {
      this.bookingForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.errorMessage = '';

    const value = this.bookingForm.getRawValue();

    const request = {
      packageId: this.packageData._id,
      customerName: value.customerName!.trim(),
      customerPhone: value.customerPhone!,
      bookingDate: value.bookingDate!,
      timeSlot: value.timeSlot!,
      quantity: Number(value.quantity),
    };

    this.bookingService.createBooking(request).subscribe({
      next: (booking) => {
        this.bookingService.createPaymentLink(booking.bookingId).subscribe({
          next: (payment) => {
            window.location.href = payment.paymentUrl;
          },

          error: (error) => {
            console.error(error);

            this.submitting = false;

            this.errorMessage =
              error?.error?.message ||
              'Unable to create payment. Please try again.';
          },
        });
      },

      error: (error) => {
        console.error(error);

        this.submitting = false;

        this.errorMessage =
          error?.error?.message ||
          'Unable to create booking. Please try again.';
      },
    });
  }
}
