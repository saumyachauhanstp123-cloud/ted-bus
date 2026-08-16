import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NotificationService } from '../../services/notification';
import { Notification } from '../../models/notification';
import { TranslatePipe } from '@ngx-translate/core';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe],
  templateUrl: './notifications.html',
  styleUrl: './notifications.css'
})
export class Notifications implements OnInit {
  notificationService = inject(NotificationService);
  private toast = inject(ToastService);

  filter = signal<'all' | 'unread' | 'read'>('all');

  ngOnInit(): void {
    this.notificationService.loadNotifications();
  }

  filteredNotifications(): Notification[] {
    const all = this.notificationService.notifications();
    const f = this.filter();

    if (f === 'unread') return all.filter(n => !n.isRead);
    if (f === 'read') return all.filter(n => n.isRead);
    return all;
  }

  setFilter(value: 'all' | 'unread' | 'read'): void {
    this.filter.set(value);
  }

  markAsRead(id: string): void {
    this.notificationService.markAsRead(id);
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead();
  }

  deleteNotification(id: string): void {
    this.notificationService.deleteNotification(id);
  }

  retryDelivery(id: string): void {
    this.notificationService.retryDelivery(id).subscribe({
      next: () => {
        this.notificationService.loadNotifications();
      },
      error: (err: any) => {
        this.toast.error(err?.error?.message || 'Retry failed');
      }
    });
  }

  hasFailed(notification: Notification): boolean {
    return notification.channels?.email?.status === 'Failed'
      || notification.channels?.push?.status === 'Failed';
  }

  // ✅ FIXED — added dark mode classes
  getChannelBadge(status: string): string {
    switch (status) {
      case 'Sent':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200/60 dark:border-green-800/60';
      case 'Failed':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200/60 dark:border-red-800/60';
      case 'Pending':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200/60 dark:border-yellow-800/60';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200/60 dark:border-gray-700';
    }
  }

  getIcon(type: string): string {
    switch (type) {
      case 'Booking':
        return '🎫';
      case 'Cancellation':
        return '❌';
      case 'Promotion':
        return '🎉';
      case 'Alert':
        return '⚠️';
      case 'Reminder':
        return '⏰';
      case 'ScheduleChange':
        return '📅';
      default:
        return '🔔';
    }
  }

  getTypeKey(type: string): string {
    const map: { [key: string]: string } = {
      'Booking': 'NOTIFICATION_TYPES.BOOKING',
      'Cancellation': 'NOTIFICATION_TYPES.CANCELLATION',
      'ScheduleChange': 'NOTIFICATION_TYPES.SCHEDULE_CHANGE',
      'Reminder': 'NOTIFICATION_TYPES.REMINDER',
      'Promotion': 'NOTIFICATION_TYPES.PROMOTION',
      'Alert': 'NOTIFICATION_TYPES.ALERT',
      'System': 'NOTIFICATION_TYPES.SYSTEM'
    };
    return map[type] || 'NOTIFICATION_TYPES.SYSTEM';
  }

  getTimeAgo(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;

      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short'
      });
    } catch {
      return '';
    }
  }
}