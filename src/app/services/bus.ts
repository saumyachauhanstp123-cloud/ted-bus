import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BusService {
  private apiUrl = 'https://ted-bus-1.onrender.com/api/bus';

  // 🔥 Signal for buses list (Admin panel table mein use hoga)
  buses = signal<any[]>([]);
  loading = signal(false);

  constructor(private http: HttpClient) {}

  // Get all buses + update signal
  getAllBuses(): void {
    this.loading.set(true);
    this.http.get<any>(this.apiUrl).subscribe({
      next: (res) => {
        this.buses.set(res.buses || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  // Search buses
  searchBuses(source: string, destination: string): Observable<any> {
    const params = new HttpParams()
      .set('source', source)
      .set('destination', destination);
    return this.http.get(`${this.apiUrl}/search`, { params });
  }

  // Get bus by ID
  getBusById(busId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${busId}`);
  }

  // 🔥 ADD BUS (Admin)
  addBus(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/add`, data);
  }

  // 🔥 DELETE BUS (Admin)
  deleteBus(busId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${busId}`);
  }

  // Update bus
  updateBus(busId: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${busId}`, data);
  }
}