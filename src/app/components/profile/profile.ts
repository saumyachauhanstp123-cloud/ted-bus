import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { ToastService } from '../../services/toast.service';
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink,TranslatePipe],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile implements OnInit {
  private translate = inject(TranslateService);
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private toast = inject(ToastService);

  private apiUrl =
  'https://ted-bus-1.onrender.com/api';

  // Profile data
  name = '';
  email = '';
  phone = '';
  bio = '';
  avatar = '';
  role = '';
  isVerified = false;
  memberSince = '';

  // Stats
  stats = signal({
    totalPosts: 0,
    totalLikes: 0,
    totalComments: 0,
    totalBookings: 0,
    confirmedBookings: 0,
    cancelledBookings: 0,
  });

  // Recent activity
  recentPosts = signal<any[]>([]);
  recentBookings = signal<any[]>([]);

  // UI State
  isEditing = signal(false);
  loading = signal(true);
  saving = signal(false);
  activeTab = signal<'overview' | 'bookings' | 'posts'>('overview');
  successMessage = signal('');
  errorMessage = signal('');

  ngOnInit(): void {
    this.loadProfile();
    this.loadStats();
    this.loadRecentPosts();
    this.loadRecentBookings();
  }

  // ================================
  // LOAD PROFILE
  // ================================
  private loadProfile(): void {
    this.loading.set(true);

    this.http.get<any>(`${this.apiUrl}/auth/me`).subscribe({
      next: (res) => {
        const user = res.user || res;

        this.name = user.name || '';
        this.email = user.email || '';
        this.phone = user.phone || '';
        this.bio = user.bio || '';
        this.avatar = user.avatar || '';
        this.role = user.role || 'user';
        this.isVerified = user.isVerified || false;
        this.memberSince = user.createdAt || '';

        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.loading.set(false);
        this.errorMessage.set('Failed to load profile');
      },
    });
  }

  // ================================
  // LOAD STATS
  // ================================
  private loadStats(): void {
    // Community stats
    this.http.get<any>(`${this.apiUrl}/community/stats`).subscribe({
      next: (res) => {
        this.stats.update(s => ({
          ...s,
          totalPosts: res.stats?.totalPosts || 0,
          totalLikes: res.stats?.totalLikes || 0,
          totalComments: res.stats?.totalComments || 0,
        }));
      },
      error: () => {},
    });

    // Booking stats
    this.http.get<any>(`${this.apiUrl}/booking/my-bookings`).subscribe({
      next: (res) => {
        const bookings = res.bookings || [];

        this.stats.update(s => ({
          ...s,
          totalBookings: bookings.length,
          confirmedBookings: bookings.filter((b: any) => b.bookingStatus === 'Confirmed').length,
          cancelledBookings: bookings.filter((b: any) => b.bookingStatus === 'Cancelled').length,
        }));
      },
      error: () => {},
    });
  }

  // ================================
  // LOAD RECENT POSTS
  // ================================
  private loadRecentPosts(): void {
    this.http.get<any>(`${this.apiUrl}/community/posts`).subscribe({
      next: (res) => {
        const userId = this.authService.currentUser()?._id;

        const myPosts = (res.posts || [])
          .filter((p: any) => p.author?._id === userId)
          .slice(0, 5);

        this.recentPosts.set(myPosts);
      },
      error: () => {},
    });
  }

  // ================================
  // LOAD RECENT BOOKINGS
  // ================================
  private loadRecentBookings(): void {
    this.http.get<any>(`${this.apiUrl}/booking/my-bookings`).subscribe({
      next: (res) => {
        const bookings = (res.bookings || []).slice(0, 5);
        this.recentBookings.set(bookings);
      },
      error: () => {},
    });
  }

  // ================================
  // AVATAR UPLOAD
  // ================================
  triggerFileInput(): void {
    const fileInput = document.getElementById('avatarInput') as HTMLInputElement;
    fileInput?.click();
  }

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];

    if (!file.type.startsWith('image/')) {
      this.errorMessage.set('Please select a valid image file.');
      this.toast.warning('Please select a valid image file.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      this.errorMessage.set('Image size should be less than 2MB.');
      this.toast.warning('Image size should be less than 2MB.');
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      this.avatar = reader.result as string;
      this.errorMessage.set('');
      this.successMessage.set('Photo selected. Click Save Changes to keep it.');
      setTimeout(() => this.successMessage.set(''), 3000);
    };

    reader.readAsDataURL(file);
  }

  onImageError(): void {
    this.avatar = '';
  }

  removeAvatar(): void {
    this.avatar = '';
    this.successMessage.set('Photo removed. Click Save Changes to update profile.');
    setTimeout(() => this.successMessage.set(''), 3000);
  }

  // ================================
  // TOGGLE EDIT MODE
  // ================================
  toggleEdit(): void {
    this.isEditing.update(v => !v);
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  // ================================
  // UPDATE PROFILE
  // ================================
  updateProfile(): void {
    if (!this.name.trim()) {
      this.errorMessage.set('Name cannot be empty');
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.http.put<any>(`${this.apiUrl}/auth/update-profile`, {
      name: this.name.trim(),
      phone: this.phone.trim(),
      bio: this.bio.trim(),
      avatar: this.avatar,
    }).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.isEditing.set(false);
        this.successMessage.set('Profile updated successfully! ✅');
        this.toast.success('Profile updated successfully!');

        const updatedUser = res.user || res;

        // Update AuthService signal
        const current = this.authService.currentUser();

        if (current) {
          this.authService.currentUser.set({
            ...current,
            name: updatedUser.name,
            isVerified: updatedUser.isVerified ?? current.isVerified,
            avatar: updatedUser.avatar ?? this.avatar,
          });
        }

        // Update localStorage
        const stored = localStorage.getItem('user');

        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.name = updatedUser.name;
          parsed.avatar = updatedUser.avatar ?? this.avatar;
          parsed.isVerified = updatedUser.isVerified ?? parsed.isVerified;
          localStorage.setItem('user', JSON.stringify(parsed));
        }

        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(err?.error?.message || 'Update failed');
      },
    });
  }

  // ================================
  // REQUEST VERIFICATION
  // ================================
  requestVerification(): void {
    this.http.put<any>(`${this.apiUrl}/auth/verify-me`, {}).subscribe({
      next: () => {
        this.isVerified = true;
        this.successMessage.set('Account verified successfully! ✅');
        this.toast.success('Account verified successfully!');

        const stored = localStorage.getItem('user');

        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.isVerified = true;
          localStorage.setItem('user', JSON.stringify(parsed));
        }

        const current = this.authService.currentUser();

        if (current) {
          this.authService.currentUser.set({
            ...current,
            isVerified: true,
          });
        }

        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message || 'Verification failed');
      },
    });
  }

  // ================================
  // HELPERS
  // ================================
  getInitials(): string {
    return this.name ? this.name.charAt(0).toUpperCase() : '?';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';

    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  }

  getTimeAgo(dateStr: string): string {
    try {
      const diff = Date.now() - new Date(dateStr).getTime();
      const mins = Math.floor(diff / 60000);

      if (mins < 60) return `${mins}m ago`;

      const hrs = Math.floor(mins / 60);

      if (hrs < 24) return `${hrs}h ago`;

      return `${Math.floor(hrs / 24)}d ago`;
    } catch {
      return '';
    }
  }
}