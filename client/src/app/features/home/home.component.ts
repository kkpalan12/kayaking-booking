import { CommonModule } from '@angular/common';

import { Component, inject, OnInit } from '@angular/core';

import { Router } from '@angular/router';

import { PackageService } from '../../core/services/package.service';

import { KayakingPackage } from '../../core/models/package.model';

@Component({
  selector: 'app-home',

  standalone: true,

  imports: [CommonModule],

  templateUrl: './home.component.html',

  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  private readonly packageService = inject(PackageService);

  private readonly router = inject(Router);

  packages: KayakingPackage[] = [];

  loading = true;

  error = false;

  /**
   * Google Business listing.
   *
   * We intentionally use the direct Google
   * listing instead of the Google Places API.
   *
   * This means:
   * - No Google Cloud API key
   * - No billing
   * - No API calls from our server
   */
  readonly googleReviewsUrl = 'https://share.google/Rp6uMPSE3NUKZHxOR';

  /**
   * Business location.
   */
  readonly locationUrl = 'https://share.google/Rp6uMPSE3NUKZHxOR';

  ngOnInit(): void {
    this.packageService.getPackages().subscribe({
      next: (packages) => {
        this.packages = packages.filter((item) => item.isActive);

        this.loading = false;
      },

      error: (error) => {
        console.error('Failed to load packages', error);

        this.error = true;

        this.loading = false;
      },
    });
  }

  /**
   * Navigate to booking page.
   */
  bookNow(packageData: KayakingPackage): void {
    this.router.navigate(['/booking', packageData._id]);
  }

  /**
   * Calculate final discounted price.
   */
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

    return Math.max(
      0,

      packageData.price - packageData.discount.value,
    );
  }

  /**
   * Check whether package has
   * an actual discount.
   */
  hasDiscount(packageData: KayakingPackage): boolean {
    return (
      packageData.discount?.enabled === true &&
      this.getDiscountedPrice(packageData) < packageData.price
    );
  }

  /**
   * Display discount text.
   */
  getDiscountText(packageData: KayakingPackage): string {
    if (!packageData.discount?.enabled) {
      return '';
    }

    if (packageData.discount.type === 'PERCENTAGE') {
      return `${packageData.discount.value}% OFF`;
    }

    return `₹${packageData.discount.value} OFF`;
  }

  /**
   * Pricing label.
   */
  getPricingLabel(packageData: KayakingPackage): string {
    return packageData.pricingType === 'PER_PERSON'
      ? 'per person'
      : 'per booking';
  }

  /**
   * Use first available package image
   * as hero background.
   */
  getHeroImage(): string | null {
    const packageWithImage = this.packages.find((item) => !!item.image);

    return packageWithImage?.image ?? null;
  }

  /**
   * Dynamic hero background style.
   */
  get heroStyle(): Record<string, string> {
    const image = this.getHeroImage();

    if (!image) {
      return {};
    }

    return {
      '--hero-image': `url("${image}")`,
    };
  }

  /**
   * Smooth scroll to packages.
   */
  scrollToExperiences(): void {
    document.getElementById('experiences')?.scrollIntoView({
      behavior: 'smooth',
    });
  }
}
