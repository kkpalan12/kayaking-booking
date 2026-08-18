import { CommonModule } from '@angular/common';

import { Component, inject, OnInit } from '@angular/core';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { RouterLink } from '@angular/router';
import { AdminNavComponent } from '../shared/navigation/admin-nav.component';

import {
  PackageService,
  CreatePackageRequest,
} from '../../../core/services/package.service';

import {
  KayakingPackage,
  PricingType,
  DiscountType,
} from '../../../core/models/package.model';

@Component({
  selector: 'app-admin-packages',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, AdminNavComponent],
  templateUrl: './admin-packages.component.html',
  styleUrl: './admin-packages.component.scss',
})
export class AdminPackagesComponent implements OnInit {
  private readonly packageService = inject(PackageService);

  private readonly fb = inject(FormBuilder);

  packages: KayakingPackage[] = [];

  loading = true;

  saving = false;

  error = '';

  successMessage = '';

  editingId: string | null = null;

  showForm = false;

  packageForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],

    slug: ['', [Validators.required, Validators.minLength(2)]],

    description: [''],

    price: [0, [Validators.required, Validators.min(0)]],

    pricingType: ['PER_PERSON' as PricingType, Validators.required],

    discountEnabled: [false],

    discountType: ['PERCENTAGE' as DiscountType],

    discountValue: [0, [Validators.min(0)]],

    duration: [''],

    image: [''],

    isActive: [true],
  });

  ngOnInit(): void {
    this.loadPackages();
  }

  loadPackages(): void {
    this.loading = true;

    this.error = '';

    this.packageService.getAdminPackages().subscribe({
      next: (packages) => {
        this.packages = packages;

        this.loading = false;
      },

      error: (error) => {
        console.error('Failed to load packages', error);

        this.error = error?.error?.message || 'Unable to load packages.';

        this.loading = false;
      },
    });
  }

  openCreate(): void {
    this.editingId = null;

    this.showForm = true;

    this.successMessage = '';

    this.error = '';

    this.packageForm.reset({
      name: '',
      slug: '',
      description: '',
      price: 0,
      pricingType: 'PER_PERSON',
      discountEnabled: false,
      discountType: 'PERCENTAGE',
      discountValue: 0,
      duration: '',
      image: '',
      isActive: true,
    });
  }

  editPackage(packageData: KayakingPackage): void {
    this.editingId = packageData._id;

    this.showForm = true;

    this.successMessage = '';

    this.error = '';

    this.packageForm.patchValue({
      name: packageData.name,

      slug: packageData.slug,

      description: packageData.description || '',

      price: packageData.price,

      pricingType: packageData.pricingType,

      discountEnabled: packageData.discount?.enabled || false,

      discountType: packageData.discount?.type || 'PERCENTAGE',

      discountValue: packageData.discount?.value || 0,

      duration: packageData.duration || '',

      image: packageData.image || '',

      isActive: packageData.isActive,
    });
  }

  cancelForm(): void {
    this.showForm = false;

    this.editingId = null;

    this.error = '';
  }

  savePackage(): void {
    if (this.packageForm.invalid || this.saving) {
      this.packageForm.markAllAsTouched();

      return;
    }

    this.saving = true;

    this.error = '';

    this.successMessage = '';

    const value = this.packageForm.getRawValue();

    const request: CreatePackageRequest = {
      name: value.name?.trim() || '',

      slug: value.slug?.trim() || '',

      description: value.description?.trim() || '',

      price: Number(value.price),

      pricingType: value.pricingType as PricingType,

      discount: {
        enabled: value.discountEnabled === true,

        type: value.discountType as DiscountType,

        value: Number(value.discountValue || 0),
      },

      duration: value.duration?.trim() || '',

      image: value.image?.trim() || '',

      isActive: value.isActive === true,
    };

    const editing = !!this.editingId;

    const request$ = editing
      ? this.packageService.updatePackage(this.editingId!, request)
      : this.packageService.createPackage(request);

    request$.subscribe({
      next: () => {
        this.saving = false;

        this.showForm = false;

        this.successMessage = editing
          ? 'Package updated successfully.'
          : 'Package created successfully.';

        this.editingId = null;

        this.loadPackages();
      },

      error: (error) => {
        console.error('Failed to save package', error);

        this.saving = false;

        this.error = error?.error?.message || 'Unable to save package.';
      },
    });
  }

  deactivatePackage(packageData: KayakingPackage): void {
    const confirmed = window.confirm(
      `Deactivate "${packageData.name}"?\n\nIt will disappear from the customer homepage, but existing bookings will remain safe.`,
    );

    if (!confirmed) {
      return;
    }

    this.error = '';

    this.successMessage = '';

    this.packageService.deletePackage(packageData._id).subscribe({
      next: () => {
        this.successMessage = 'Package deactivated successfully.';

        this.loadPackages();
      },

      error: (error) => {
        console.error('Failed to deactivate package', error);

        this.error = error?.error?.message || 'Unable to deactivate package.';
      },
    });
  }

  activatePackage(packageData: KayakingPackage): void {
    this.error = '';

    this.successMessage = '';

    this.packageService.activatePackage(packageData._id).subscribe({
      next: () => {
        this.successMessage = 'Package activated successfully.';

        this.loadPackages();
      },

      error: (error) => {
        console.error('Failed to activate package', error);

        this.error = error?.error?.message || 'Unable to activate package.';
      },
    });
  }

  getDiscountText(packageData: KayakingPackage): string {
    if (!packageData.discount?.enabled) {
      return 'No offer';
    }

    return packageData.discount.type === 'PERCENTAGE'
      ? `${packageData.discount.value}% OFF`
      : `₹${packageData.discount.value} OFF`;
  }

  getImage(packageData: KayakingPackage): string | null {
    return packageData.image || null;
  }
}
