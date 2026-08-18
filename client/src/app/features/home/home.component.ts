import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { PackageService } from '../../core/services/package.service';
import { KayakingPackage } from '../../core/models/package.model';

interface GoogleReview {
  name: string;
  profileUrl: string;
  reviewerType?: string;
  reviewCount?: number;
  photoCount?: number;
  date: string;
  text: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  private readonly packageService = inject(PackageService);

  private readonly router = inject(Router);

  packages: KayakingPackage[] = [];

  loading = true;

  error = false;

  /*
   * Google reviews manually curated from the
   * River Edge Google Business listing.
   *
   * No Google API.
   * No Google Maps billing.
   */

  readonly googleReviews: GoogleReview[] = [
    {
      name: 'Adithya K Patel',
      profileUrl:
        'https://www.google.com/maps/contrib/102621684341883238829/reviews?hl=en-IN',
      reviewerType: 'Local Guide',
      reviewCount: 13,
      photoCount: 37,
      date: '2 months ago',
      text: 'Absolutely amazing experience! The mangrove kayaking and boating tour was peaceful, scenic, and well-organized. Gliding through the lush mangrove forests was both relaxing and adventurous. The guides were friendly and knowledgeable, making the experience even better.',
    },

    {
      name: 'Rajkishore K',
      profileUrl:
        'https://www.google.com/maps/contrib/104688950055571718850/reviews?hl=en-IN',
      reviewerType: 'Local Guide',
      reviewCount: 138,
      photoCount: 543,
      date: '1 month ago',
      text: 'River edge is the perfect place for the kayaking experience in Kodi. You have spacious place to park your vehicle, very professional staff are there. They will guide you about safety and how to do the kayaking, and even one staff will come along.',
    },

    {
      name: 'Vijna Bairy',
      profileUrl:
        'https://www.google.com/maps/contrib/102942790832333635966/reviews?hl=en-IN',
      reviewCount: 6,
      photoCount: 6,
      date: '3 months ago',
      text: 'Had an awesome experience on the boat ride this afternoon. Serene amongst the mangrove shade. Looking forward to Kayaking next time.',
    },

    {
      name: 'Sharathh K',
      profileUrl:
        'https://www.google.com/maps/contrib/100889102582446173935/reviews?hl=en-IN',
      reviewerType: 'Local Guide',
      reviewCount: 32,
      photoCount: 14,
      date: '3 months ago',
      text: 'Awesome experience came with family had really fun good service they provide.',
    },

    {
      name: 'vaishakh pv',
      profileUrl:
        'https://www.google.com/maps/contrib/110999499199675006921/reviews?hl=en-IN',
      reviewerType: 'Local Guide',
      reviewCount: 39,
      photoCount: 15,
      date: '3 months ago',
      text: 'We loved our time here. Much better experience than the same ones we did in other states.',
    },
  ];

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
    if (!packageData.discount?.enabled) {
      return '';
    }

    if (packageData.discount.type === 'PERCENTAGE') {
      return `${packageData.discount.value}% OFF`;
    }

    return `₹${packageData.discount.value} OFF`;
  }

  getPricingLabel(packageData: KayakingPackage): string {
    return packageData.pricingType === 'PER_PERSON'
      ? 'per person'
      : 'per booking';
  }

  getHeroImage(): string | null {
    const packageWithImage = this.packages.find((item) => !!item.image);

    return packageWithImage?.image ?? null;
  }

  get heroStyle(): Record<string, string> {
    const image = this.getHeroImage();

    if (!image) {
      return {};
    }

    return {
      '--hero-image': `url("${image}")`,
    };
  }

  scrollToExperiences(): void {
    document.getElementById('experiences')?.scrollIntoView({
      behavior: 'smooth',
    });
  }
}
