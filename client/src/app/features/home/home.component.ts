import { Component, inject } from '@angular/core';

import { CommonModule } from '@angular/common';

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
export class HomeComponent {
  private readonly packageService = inject(PackageService);

  private readonly router = inject(Router);

  packages: KayakingPackage[] = [];

  loading = true;

  ngOnInit(): void {
    this.packageService.getPackages().subscribe({
      next: (packages) => {
        this.packages = packages;
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load packages', error);

        this.loading = false;
      },
    });
  }

  bookNow(packageData: KayakingPackage): void {
    this.router.navigate(['/booking', packageData._id]);
  }
}
