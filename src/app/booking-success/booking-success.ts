import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-booking-success',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './booking-success.html',
  styleUrl: './booking-success.css',
})
export class BookingSuccess implements OnInit {
  private router = inject(Router);
  private toast = inject(ToastService);

  bookingId = '';
  passengerName = '';
  age: any = '';
  gender = '';
  mobile = '';
  selectedBus: any;
  selectedSeat = '';
  journeyDate = '';
  totalPrice: any = '';

  ngOnInit(): void {
    const state = history.state || {};

    this.bookingId = state.bookingId || ('TED' + Math.floor(100000 + Math.random() * 900000));
    this.passengerName = state.passengerName || '';
    this.age = state.age || '';
    this.gender = state.gender || '';
    this.mobile = state.mobile || '';
    this.selectedBus = state.selectedBus || null;
    this.selectedSeat = state.selectedSeat || '';
    this.journeyDate = state.journeyDate || '';
    this.totalPrice = state.totalPrice || state.selectedBus?.price || '';
     if (!this.selectedBus) {
    this.router.navigate(['/']);
    return;                        // agar bus nahi hai toh wapas
  }

  this.toast.success('🎉 Booking confirmed! Your ticket is ready.');

  }

  goHome() {
    this.router.navigate(['/']);
  }

  goMyBookings() {
    this.router.navigate(['/my-bookings']);
  }

  writeReview() {
    this.router.navigate(['/route-details'], {
      state: {
        selectedBus: this.selectedBus,
        bookingId: this.bookingId
      }
    });
  }
}