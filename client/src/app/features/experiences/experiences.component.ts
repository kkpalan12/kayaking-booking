import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import {
  KayakingPackage,
  PricingType,
} from '../../core/models/package.model';
import { PackageService } from '../../core/services/package.service';

@Component({
  selector: 'app-experiences',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './experiences.component.html',
  styleUrl: './experiences.component.scss',
})
export class ExperiencesComponent {
  private readonly packageService = inject(PackageService);
  private readonly router = inject(Router);

  packages: KayakingPackage[] = [];
  loading = true;
  error = false;
  activeFilter: 'ALL' | PricingType | 'OFFERS' = 'ALL';

  ngOnInit(): void {
    this.loadPackages();
  }

  loadPackages(): void {
    this.loading = true;
    this.error = false;

    this.packageService.getPackages().subscribe({
      next: (packages) => {
        this.packages = packages.filter((item) => item.isActive);
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load experiences', error);
        this.error = true;
        this.loading = false;
      },
    });
  }

  get filteredPackages(): KayakingPackage[] {
    switch (this.activeFilter) {
      case 'PER_PERSON':
        return this.packages.filter((item) => item.pricingType === 'PER_PERSON');
      case 'PER_BOOKING':
        return this.packages.filter((item) => item.pricingType === 'PER_BOOKING');
      case 'OFFERS':
        return this.packages.filter((item) => this.hasDiscount(item));
      default:
        return this.packages;
    }
  }

  setFilter(filter: 'ALL' | PricingType | 'OFFERS'): void {
    this.activeFilter = filter;
  }

  bookNow(packageData: KayakingPackage): void {
    this.router.navigate(['/booking', packageData._id]);
  }

  getDiscountedPrice(packageData: KayakingPackage): number {
    if (!packageData.discount?.enabled) {
      return packageData.price;
    }

    if (packageData.discount.type === 'PERCENTAGE') {
      return Math.max(
        0,
        packageData.price -
          (packageData.price * packageData.discount.value) / 100,
      );
    }

    return Math.max(0, packageData.price - packageData.discount.value);
  }

  hasDiscount(packageData: KayakingPackage): boolean {
    return (
      packageData.discount?.enabled === true &&
      this.getDiscountedPrice(packageData) < packageData.price
    );
  }

  getDiscountText(packageData: KayakingPackage): string {
    if (!this.hasDiscount(packageData)) {
      return '';
    }

    return packageData.discount.type === 'PERCENTAGE'
      ? `${packageData.discount.value}% off`
      : `₹${packageData.discount.value} off`;
  }

  getPricingLabel(packageData: KayakingPackage): string {
    return packageData.pricingType === 'PER_PERSON'
      ? 'per person'
      : 'per booking';
  }

  getDurationLabel(packageData: KayakingPackage): string {
    return packageData.duration?.trim() || 'Flexible experience';
  }

  trackById(_: number, packageData: KayakingPackage): string {
    return packageData._id;
  }
}
