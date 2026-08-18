import { Injectable, inject } from '@angular/core';

import { HttpClient } from '@angular/common/http';

import { Observable, map, tap } from 'rxjs';

import { environment } from '../../../environments/environment';

interface AdminUser {
  email: string;
  role: 'ADMIN';
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AdminAuthService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = environment.apiUrl;

  login(email: string, password: string): Observable<AdminUser> {
    return this.http
      .post<ApiResponse<AdminUser>>(
        `${this.apiUrl}/admin/auth/login`,
        {
          email,
          password,
        },
        {
          withCredentials: true,
        },
      )
      .pipe(map((response) => response.data));
  }

  me(): Observable<AdminUser> {
    return this.http
      .get<ApiResponse<AdminUser>>(`${this.apiUrl}/admin/auth/me`, {
        withCredentials: true,
      })
      .pipe(map((response) => response.data));
  }

  logout(): Observable<void> {
    return this.http.post<void>(
      `${this.apiUrl}/admin/auth/logout`,
      {},
      {
        withCredentials: true,
      },
    );
  }
}
