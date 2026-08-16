import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RouteReview {
  _id: string;
  user: {
    _id: string;
    name: string;
    avatar?: string;
    isVerified?: boolean;
  };
  booking: string;
  bus: string;
  rating: number;
  reviewText: string;
  helpfulCount: number;
  helpfulBy: string[];
  reportCount: number;
  status: 'active' | 'hidden' | 'removed';
  isTrustedReviewer: boolean;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5000/api/reviews';

  getRouteReviews(busId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/route/${busId}`);
  }

  getEligibleBookings(busId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/eligible/${busId}`);
  }

  createReview(data: {
    bookingId: string;
    rating: number;
    reviewText: string;
  }): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  updateReview(
    reviewId: string,
    data: {
      rating?: number;
      reviewText?: string;
    }
  ): Observable<any> {
    return this.http.put(`${this.apiUrl}/${reviewId}`, data);
  }

  markHelpful(reviewId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${reviewId}/helpful`, {});
  }

  reportReview(reviewId: string, reason = 'other'): Observable<any> {
    return this.http.put(`${this.apiUrl}/${reviewId}/report`, { reason });
  }
}