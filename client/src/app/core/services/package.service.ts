import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { KayakingPackage } from '../models/package.model';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

@Injectable({
  providedIn: 'root',
})
export class PackageService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = `${environment.apiUrl}/packages`;

  getPackages(): Observable<KayakingPackage[]> {
    return this.http
      .get<ApiResponse<KayakingPackage[]>>(this.apiUrl)
      .pipe(map((response) => response.data));
  }
}
