import { Injectable, inject } from '@angular/core';

import { HttpClient } from '@angular/common/http';

import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';

import {
  KayakingPackage,
  PricingType,
  DiscountType,
} from '../models/package.model';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface CreatePackageRequest {
  name: string;
  slug: string;
  description?: string;
  price: number;
  pricingType: PricingType;
  discount: {
    enabled: boolean;
    type: DiscountType;
    value: number;
  };
  duration?: string;
  image?: string;
  isActive: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class PackageService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = `${environment.apiUrl}/packages`;

  /**
   * Public customer-facing packages.
   */
  getPackages(): Observable<KayakingPackage[]> {
    return this.http
      .get<ApiResponse<KayakingPackage[]>>(this.apiUrl)
      .pipe(map((response) => response.data));
  }

  /**
   * Admin: all packages, including inactive.
   */
  getAdminPackages(): Observable<KayakingPackage[]> {
    return this.http
      .get<ApiResponse<KayakingPackage[]>>(`${this.apiUrl}/admin/all`, {
        withCredentials: true,
      })
      .pipe(map((response) => response.data));
  }

  /**
   * Admin: create.
   */
  createPackage(request: CreatePackageRequest): Observable<KayakingPackage> {
    return this.http
      .post<ApiResponse<KayakingPackage>>(`${this.apiUrl}/admin`, request, {
        withCredentials: true,
      })
      .pipe(map((response) => response.data));
  }

  /**
   * Admin: update.
   */
  updatePackage(
    id: string,
    request: CreatePackageRequest,
  ): Observable<KayakingPackage> {
    return this.http
      .put<ApiResponse<KayakingPackage>>(
        `${this.apiUrl}/admin/${id}`,
        request,
        {
          withCredentials: true,
        },
      )
      .pipe(map((response) => response.data));
  }

  /**
   * Admin: deactivate.
   */
  deletePackage(id: string): Observable<KayakingPackage> {
    return this.http
      .delete<ApiResponse<KayakingPackage>>(`${this.apiUrl}/admin/${id}`, {
        withCredentials: true,
      })
      .pipe(map((response) => response.data));
  }

  /**
   * Admin: reactivate.
   */
  activatePackage(id: string): Observable<KayakingPackage> {
    return this.http
      .patch<ApiResponse<KayakingPackage>>(
        `${this.apiUrl}/admin/${id}/activate`,
        {},
        {
          withCredentials: true,
        },
      )
      .pipe(map((response) => response.data));
  }
}
