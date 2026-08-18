import { Injectable, inject } from '@angular/core';

import { HttpClient } from '@angular/common/http';

import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface GoogleReview {
  rating: number;

  text: string;

  authorName: string;

  authorUri: string | null;

  authorPhotoUri: string | null;

  relativeTime: string;

  publishTime: string | null;

  googleMapsUri: string | null;
}

export interface GoogleReviews {
  rating: number;

  reviewCount: number;

  reviews: GoogleReview[];

  googleMapsUri: string | null;

  reviewsUri: string | null;
}

interface ApiResponse<T> {
  success: boolean;

  data: T;

  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class GoogleReviewsService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = environment.apiUrl;

  getReviews(): Observable<GoogleReviews> {
    return this.http
      .get<ApiResponse<GoogleReviews>>(`${this.apiUrl}/google-reviews`)
      .pipe(map((response) => response.data));
  }
}
