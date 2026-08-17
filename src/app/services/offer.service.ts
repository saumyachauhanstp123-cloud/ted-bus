import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Offer {
  _id: string;
  code: string;
  title: string;
  description: string;
  discountPercentage: number;
  maxDiscountAmount: number;
  validTill: string;
  isActive: boolean;
  createdAt?: string;
}

@Injectable({ providedIn: 'root' })
export class OfferService {
  private http = inject(HttpClient);
  private apiUrl = 'https://ted-bus-1.onrender.com/api/offers';

  activeOffers = signal<Offer[]>([]);
  allOffers = signal<Offer[]>([]);
  loading = signal(false);

  loadActiveOffers(): void {
    this.loading.set(true);
    this.http.get<any>(`${this.apiUrl}/active`).subscribe({
      next: (res) => {
        this.activeOffers.set(res.offers || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  loadAllOffers(): void {
    this.loading.set(true);
    this.http.get<any>(this.apiUrl).subscribe({
      next: (res) => {
        this.allOffers.set(res.offers || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  createOffer(data: Partial<Offer>): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  deleteOffer(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  applyPromoCode(code: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/apply`, { code });
  }
}