import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  bio?: string;
  avatar?: string;
  isVerified?: boolean;
  role?: string;
  createdAt?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private http = inject(HttpClient);
  private router = inject(Router);

  private apiUrl = 'https://ted-bus-1.onrender.com/api/auth';

  // 🔥 Signals — poori app mein yahan se login state milega
  currentUser = signal<User | null>(this.getUserFromStorage());

  // 🔥 Computed — currentUser hai toh loggedIn hai
  isLoggedIn = computed(() => this.currentUser() !== null);

  // ---------- API CALLS ----------

  login(data: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, data).pipe(
      tap((res) => this.saveSession(res))
    );
  }

 register(data: {
  name: string;
  email: string;
  password: string;
  phone?: string;
}): Observable<any> {
  return this.http.post<any>(`${this.apiUrl}/register`, data);
}

  // ---------- SESSION MANAGEMENT ----------

  private saveSession(res: AuthResponse): void {
    localStorage.setItem('token', res.token);
    localStorage.setItem('user', JSON.stringify(res.user));
    this.currentUser.set(res.user); // 🔥 Signal update — Navbar automatically update hoga
  }

  private getUserFromStorage(): User | null {
    try {
      const user = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      if (user && token) {
        return JSON.parse(user) as User;
      }
      return null;
    } catch {
      return null;
    }
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUser.set(null); // 🔥 Signal null — Navbar turant update hoga
    this.router.navigate(['/']);
  }
  // Existing login/register methods ke baad ye add karo:

verifyOTP(email: string, otp: string): Observable<AuthResponse> {
  return this.http.post<AuthResponse>(
    `${this.apiUrl}/verify-otp`,
    { email, otp }
  ).pipe(
    tap((response) => this.saveSession(response))
  );
}

resendOTP(email: string): Observable<any> {
  return this.http.post(`${this.apiUrl}/resend-otp`, { email });
}
}