import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../services/notification';
import { TranslatePipe } from '@ngx-translate/core';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-notification-preferences',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './notification-preferences.html',
  styleUrl: './notification-preferences.css'
})
export class NotificationPreferences implements OnInit {
  private notificationService = inject(NotificationService);
  private toast = inject(ToastService);

  email = true;
  push = true;
  bookingUpdates = true;
  promotional = true;
  language = 'en';

  loading = signal(false);
  saved = signal(false);
  testing = signal(false);

  ngOnInit(): void {
    this.loading.set(true);
    this.notificationService.getPreferencesFromServer().subscribe({
      next: (res: any) => {
        const p = res.preferences || {};
        this.email = p.email ?? true;
        this.push = p.push ?? true;
        this.bookingUpdates = p.bookingUpdates ?? true;
        this.promotional = p.promotional ?? true;
        this.language = p.language || 'en';
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  savePreferences(): void {
    this.notificationService.updatePreferencesOnServer({
      email: this.email,
      push: this.push,
      bookingUpdates: this.bookingUpdates,
      promotional: this.promotional,
      language: this.language,
    }).subscribe({
      next: () => {
        this.saved.set(true);
        setTimeout(() => this.saved.set(false), 3000);
      },
     error: (err: any) => this.toast.error(err?.error?.message || 'Failed to save'),
    });
  }

  sendTestPromo(): void {
    this.testing.set(true);
    this.notificationService.sendTestPromo().subscribe({
     next: (res: any) => {
  this.testing.set(false);
  this.toast.success(res.message || 'Test notification sent!');
},
      error: () => this.testing.set(false),
    });
  }
}