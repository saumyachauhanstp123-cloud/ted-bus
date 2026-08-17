import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BookingService {

  private apiUrl = 'https://ted-bus-1.onrender.com/api/booking';

  constructor(private http: HttpClient) {}

  bookTicket(data: any): Observable<any> {

  const token = localStorage.getItem('token');

  const headers = new HttpHeaders({
    Authorization: `Bearer ${token}`
  });

  return this.http.post(
    `${this.apiUrl}/book`,
    data,
    { headers }
  );

}
getMyBookings(): Observable<any> {

  const token = localStorage.getItem('token');

  const headers = new HttpHeaders({
    Authorization: `Bearer ${token}`
  });

  return this.http.get(
    `${this.apiUrl}/my-bookings`,
    { headers }
  );

}
getBusById(busId: string): Observable<any> {

  return this.http.get(
    `https://ted-bus-1.onrender.com/api/bus/${busId}`
  );

}
cancelBooking(id: string): Observable<any> {

  const token = localStorage.getItem('token');

  const headers = new HttpHeaders({
    Authorization: `Bearer ${token}`
  });

  return this.http.put(
    `${this.apiUrl}/cancel/${id}`,
    {},
    { headers }
  );

}

}
