import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Notification } from '../models/notification';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5000/api/notification';

  notifications = signal<Notification[]>([]);
  loading = signal(false);
  unreadCount = signal(0);

  hasUnread = computed(() => this.unreadCount() > 0);

  // ================================
  // LOAD ALL NOTIFICATIONS
  // ================================
  loadNotifications(): void {
    this.loading.set(true);

    this.http.get<any>(this.apiUrl).subscribe({
      next: (res) => {
        this.notifications.set(res.notifications || []);
        this.unreadCount.set(res.unreadCount || 0);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Notification load error:', err);
        this.loading.set(false);
      }
    });
  }

  // ================================
  // REFRESH UNREAD COUNT
  // ================================
  refreshUnreadCount(): void {
    this.http.get<any>(this.apiUrl).subscribe({
      next: (res) => {
        this.unreadCount.set(res.unreadCount || 0);
      },
      error: () => {}
    });
  }

  // ================================
  // MARK SINGLE AS READ
  // ================================
  markAsRead(id: string): void {
    this.http.put<any>(`${this.apiUrl}/${id}/read`, {}).subscribe({
      next: () => {
        this.notifications.update(list =>
          list.map(n => n._id === id ? { ...n, isRead: true } : n)
        );
        this.unreadCount.update(c => Math.max(0, c - 1));
      },
      error: (err) => console.error(err)
    });
  }

  // ================================
  // MARK ALL AS READ
  // ================================
  markAllAsRead(): void {
    this.http.put<any>(`${this.apiUrl}/mark-all-read`, {}).subscribe({
      next: () => {
        this.notifications.update(list =>
          list.map(n => ({ ...n, isRead: true }))
        );
        this.unreadCount.set(0);
      },
      error: (err) => console.error(err)
    });
  }

  // ================================
  // DELETE NOTIFICATION
  // ================================
  deleteNotification(id: string): void {
    this.http.delete<any>(`${this.apiUrl}/${id}`).subscribe({
      next: () => {
        const deleted = this.notifications().find(n => n._id === id);
        this.notifications.update(list => list.filter(n => n._id !== id));

        if (deleted && !deleted.isRead) {
          this.unreadCount.update(c => Math.max(0, c - 1));
        }
      },
      error: (err) => console.error(err)
    });
  }

  // ================================
  // RETRY FAILED DELIVERY
  // ================================
  retryDelivery(id: string) {
    return this.http.put<any>(`${this.apiUrl}/${id}/retry`, {});
  }

  // ================================
  // BACKEND PREFERENCES
  // ================================
  getPreferencesFromServer() {
    return this.http.get<any>(`${this.apiUrl}/preferences`);
  }

  updatePreferencesOnServer(prefs: any) {
    return this.http.put<any>(`${this.apiUrl}/preferences`, prefs);
  }

  // ================================
  // TEST PROMO
  // ================================
  sendTestPromo() {
    return this.http.post<any>(`${this.apiUrl}/test-promo`, {});
  }

  // ================================
  // LOCAL FALLBACK
  // ================================
  getPreferences() {
    const data = localStorage.getItem('notificationPreferences');
    return data
      ? JSON.parse(data)
      : {
          email: true,
          push: true,
          bookingUpdates: true,
          promotional: true,
          language: 'en'
        };
  }

  savePreferences(preferences: any): void {
    localStorage.setItem('notificationPreferences', JSON.stringify(preferences));
  }

  getUnreadCount(): number {
    return this.unreadCount();
  }

  // ================================
  // LOCAL ADD (compatibility)
  // ================================
  addNotification(
    title: string,
    message: string,
    type: 'Success' | 'Error' | 'Warning' | 'Info' | 'Promotion' = 'Info'
  ): void {
    const mappedType: Notification['type'] =
      type === 'Promotion'
        ? 'Promotion'
        : type === 'Error' || type === 'Warning'
          ? 'Alert'
          : 'System';

    const newNotification: Notification = {
      _id: `local-${Date.now()}`,
      user: '',
      title,
      message,
      type: mappedType,
      isRead: false,
      language: 'en',
      retryCount: 0,
      maxRetries: 3,
      createdAt: new Date().toISOString()
    };

    this.notifications.update(list => [newNotification, ...list]);
    this.unreadCount.update(count => count + 1);
  }
}