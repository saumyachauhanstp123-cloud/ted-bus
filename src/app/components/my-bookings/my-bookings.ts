import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BookingService } from '../../services/booking';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-my-bookings',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe],
  templateUrl: './my-bookings.html',
  styleUrl: './my-bookings.css',
})
export class MyBookings implements OnInit {
  private bookingService = inject(BookingService);
  private toast = inject(ToastService);
  private translate = inject(TranslateService);

  bookings = signal<any[]>([]);
  loading = signal(false);
  errorMessage = signal('');

  filter = signal<'all' | 'confirmed' | 'cancelled'>('all');

  cancellingId = signal<string | null>(null);
  showConfirmModal = signal(false);
  bookingToCancel = signal<any>(null);

  filteredBookings = computed(() => {
    const all = this.bookings();
    const f = this.filter();
    if (f === 'all') return all;
    if (f === 'confirmed') return all.filter(b => b.bookingStatus === 'Confirmed');
    return all.filter(b => b.bookingStatus === 'Cancelled');
  });

  confirmedCount = computed(() => this.bookings().filter(b => b.bookingStatus === 'Confirmed').length);
  cancelledCount = computed(() => this.bookings().filter(b => b.bookingStatus === 'Cancelled').length);

  ngOnInit(): void {
    this.loadBookings();
  }

  loadBookings(): void {
    this.loading.set(true);
    this.bookingService.getMyBookings().subscribe({
      next: (response: any) => {
        this.loading.set(false);
        this.bookings.set(response.bookings || []);
      },
      error: (error) => {
        this.loading.set(false);
        this.toast.error(this.translate.instant('MY_BOOKINGS_PAGE.ERRORS.LOAD_FAILED'));
      }
    });
  }

  setFilter(value: 'all' | 'confirmed' | 'cancelled'): void {
    this.filter.set(value);
  }

  openCancelModal(booking: any): void {
    this.bookingToCancel.set(booking);
    this.showConfirmModal.set(true);
  }

  closeCancelModal(): void {
    this.bookingToCancel.set(null);
    this.showConfirmModal.set(false);
  }

  confirmCancel(): void {
    const booking = this.bookingToCancel();
    if (!booking) return;

    this.cancellingId.set(booking._id);
    this.bookingService.cancelBooking(booking._id).subscribe({
      next: () => {
        this.cancellingId.set(null);
        this.closeCancelModal();
        this.bookings.update((list) =>
          list.map((item) => item._id === booking._id ? { ...item, bookingStatus: 'Cancelled' } : item)
        );
        this.toast.success(this.translate.instant('MY_BOOKINGS_PAGE.CANCEL_SUCCESS'));
      },
      error: (error: any) => {
        this.cancellingId.set(null);
        this.closeCancelModal();
        this.toast.error(error?.error?.message || this.translate.instant('MY_BOOKINGS_PAGE.ERRORS.CANCEL_FAILED'));
      }
    });
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}