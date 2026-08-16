import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BusService } from '../services/bus';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [FormsModule, CommonModule, TranslatePipe],
  templateUrl: './booking.html',
  styleUrl: './booking.css',
})
export class Booking implements OnInit {

  private router = inject(Router);
  private busService = inject(BusService);
  private translate = inject(TranslateService);
  private toast = inject(ToastService);

  selectedBus: any = null;
  journeyDate = '';

  passengerName = '';
  age: number | null = null;
  gender = '';
  mobile = '';

  seats = signal<{row: string, col: number, label: string}[]>([]);
  bookedSeats = signal<string[]>([]);
  selectedSeat = signal('');

  loading = signal(false);
  errorMessage = signal('');

  serviceFee = 20;

  ngOnInit(): void {
    this.selectedBus = history.state.selectedBus;
    this.journeyDate = history.state.journeyDate;

    if (!this.selectedBus?._id) {
      this.errorMessage.set(this.translate.instant('BOOKING.ERRORS.NO_BUS'));
      setTimeout(() => {
        this.router.navigate(['/route-planner']);
      }, 1500);
      return;
    }

    const totalSeats = this.selectedBus.totalSeats || 40;
    this.seats.set(this.generateRealisticSeats(totalSeats));

    this.loadFreshBusDetails();
  }

  private loadFreshBusDetails(): void {
    this.loading.set(true);

    this.busService.getBusById(this.selectedBus._id).subscribe({
      next: (response: any) => {
        this.loading.set(false);

        const bus = response?.bus || response;
        this.selectedBus = { ...this.selectedBus, ...bus };
        this.bookedSeats.set(bus?.bookedSeats || []);
      },
      error: (error) => {
        console.error(error);
        this.loading.set(false);
        this.errorMessage.set(this.translate.instant('BOOKING.ERRORS.LOAD_FAILED'));
        this.toast.error(this.translate.instant('BOOKING.ERRORS.LOAD_FAILED'));
      }
    });
  }

  // Generates a realistic layout: e.g., rows A-J, 4 seats per row
  private generateRealisticSeats(totalSeats: number) {
    const layout = [];
    const rows = Math.ceil(totalSeats / 4);
    
    for (let r = 0; r < rows; r++) {
      const rowLetter = String.fromCharCode(65 + r); // A, B, C...
      for (let c = 1; c <= 4; c++) {
        // stop if we exceed total seats
        if ((r * 4) + c > totalSeats) break; 
        layout.push({
          row: rowLetter,
          col: c,
          label: `${rowLetter}${c}`
        });
      }
    }
    return layout;
  }

  isBooked(seat: string): boolean {
    return this.bookedSeats().includes(seat);
  }

  isSelected(seat: string): boolean {
    return this.selectedSeat() === seat;
  }

  selectSeat(seat: string): void {
    if (this.isBooked(seat)) {
      this.toast.warning('This seat is already booked!');
      return;
    }
    this.selectedSeat.set(seat);
    this.errorMessage.set('');
  }

  getSeatClass(seat: string): string {
    if (this.isBooked(seat)) {
      return 'bg-gray-200 text-gray-400 cursor-not-allowed border-gray-200 shadow-inner';
    }
    if (this.isSelected(seat)) {
      return 'bg-red-600 text-white border-red-600 shadow-lg scale-105 ring-4 ring-red-100';
    }
    return 'bg-white text-gray-700 border-gray-300 hover:border-red-500 hover:text-red-600 shadow-sm';
  }

  baseFare(): number {
    return Number(this.selectedBus?.price || 0);
  }

  gstAmount(): number {
    return Math.round(this.baseFare() * 0.05);
  }

  totalAmount(): number {
    return this.baseFare() + this.serviceFee + this.gstAmount();
  }

  continueBooking(): void {
    const name = this.passengerName.trim();
    const mobile = this.mobile.trim();

    if (!this.selectedSeat()) {
      this.errorMessage.set(this.translate.instant('BOOKING.ERRORS.SELECT_SEAT'));
      this.toast.warning(this.translate.instant('BOOKING.ERRORS.SELECT_SEAT'));
      return;
    }

    if (!name || !this.age || !this.gender || !mobile) {
      this.errorMessage.set(this.translate.instant('BOOKING.ERRORS.FILL_DETAILS'));
      this.toast.warning(this.translate.instant('BOOKING.ERRORS.FILL_DETAILS'));
      return;
    }

    if (this.age < 1 || this.age > 120) {
      this.errorMessage.set(this.translate.instant('BOOKING.ERRORS.INVALID_AGE'));
      return;
    }

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      this.errorMessage.set(this.translate.instant('BOOKING.ERRORS.INVALID_MOBILE'));
      return;
    }

    if (this.isBooked(this.selectedSeat())) {
      this.errorMessage.set(this.translate.instant('BOOKING.ERRORS.SEAT_BOOKED'));
      return;
    }

    const bookingData = {
      bus: this.selectedBus._id,
      seatNumber: this.selectedSeat(),
      passengerName: name,
      age: Number(this.age),
      gender: this.gender,
      mobile,
      journeyDate: this.journeyDate,
      totalPrice: this.totalAmount()
    };

    this.router.navigate(['/payment'], {
      state: {
        bookingData,
        selectedBus: this.selectedBus,
        fareSummary: {
          baseFare: this.baseFare(),
          serviceFee: this.serviceFee,
          gst: this.gstAmount(),
          total: this.totalAmount()
        }
      }
    });
  }
}