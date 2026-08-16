import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5000/api/admin';

  stats = signal<any>({});
  reports = signal<any[]>([]);
  users = signal<any[]>([]);
  loading = signal(false);

  loadStats() {
    this.http.get<any>(`${this.apiUrl}/stats`).subscribe({
      next: (res) => this.stats.set(res.stats),
      error: (err) => console.error(err),
    });
  }

  loadReports(status = 'pending') {
    this.loading.set(true);
    this.http.get<any>(`${this.apiUrl}/reports?status=${status}`).subscribe({
      next: (res) => {
        this.reports.set(res.reports || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  reviewReport(id: string, action: string, note = '') {
    return this.http.put(`${this.apiUrl}/reports/${id}/review`, { action, note });
  }

  loadUsers(search = '', filter = '') {
    this.loading.set(true);
    const params: any = {};
    if (search) params.search = search;
    if (filter) params.filter = filter;

    this.http.get<any>(`${this.apiUrl}/users`, { params }).subscribe({
      next: (res) => {
        this.users.set(res.users || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  toggleVerification(id: string) {
    return this.http.put(`${this.apiUrl}/users/${id}/verify`, {});
  }

  toggleBan(id: string) {
    return this.http.put(`${this.apiUrl}/users/${id}/ban`, {});
  }

  changeRole(id: string, role: string) {
    return this.http.put(`${this.apiUrl}/users/${id}/role`, { role });
  }
}