import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BookingService } from '../services/booking';
import { OfferService } from '../services/offer.service';
import { ToastService } from '../services/toast.service';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './payment.html',
  styleUrl: './payment.css'
})
export class Payment implements OnInit {
  private bookingService = inject(BookingService);
  private offerService = inject(OfferService);
  private router = inject(Router);
  private toast = inject(ToastService);
  private translate = inject(TranslateService);

  bookingData: any = null;
  selectedBus: any = null;
  fareSummary: any = null;

  promoCode = '';
  appliedOffer = signal<any>(null);
  discountAmount = signal(0);
  finalPrice = signal(0);

  paymentMethod = signal<'upi' | 'card' | 'wallet'>('upi');
  loading = signal(false);
  applyingPromo = signal(false);
  errorMessage = signal('');

  upiId = '';
  cardNumber = '';
  cardName = '';
  cardExpiry = '';
  cardCvv = '';

  ngOnInit(): void {
    this.bookingData = history.state.bookingData;
    this.selectedBus = history.state.selectedBus;
    this.fareSummary = history.state.fareSummary;

    if (!this.bookingData || !this.selectedBus) {
      this.errorMessage.set(this.translate.instant('PAYMENT.ERRORS.SESSION_EXPIRED'));
      setTimeout(() => this.router.navigate(['/']), 2000);
      return;
    }

    this.finalPrice.set(this.bookingData.totalPrice);
  }

  applyPromo(): void {
    if (!this.promoCode.trim()) {
      this.toast.warning('Please enter a promo code');
      return;
    }

    this.applyingPromo.set(true);

    this.offerService.applyPromoCode(this.promoCode.trim()).subscribe({
      next: (res: any) => {
        this.applyingPromo.set(false);

        const offer = res.offer;

        let discount = Math.round(
          (this.bookingData.totalPrice * offer.discountPercentage) / 100
        );

        if (discount > offer.maxDiscountAmount) {
          discount = offer.maxDiscountAmount;
        }

        this.appliedOffer.set(offer);
        this.discountAmount.set(discount);
        this.finalPrice.set(this.bookingData.totalPrice - discount);

        this.toast.success(`Code ${offer.code} applied! ₹${discount} saved.`);
      },
      error: (err: any) => {
        this.applyingPromo.set(false);
        this.toast.error(err?.error?.message || 'Invalid Promo Code');
        this.removePromo();
      }
    });
  }

  removePromo(): void {
    this.appliedOffer.set(null);
    this.discountAmount.set(0);
    this.finalPrice.set(this.bookingData.totalPrice);
    this.promoCode = '';
  }

  payNow(): void {
    if (!this.bookingData) return;

    if (this.paymentMethod() === 'upi' && !this.upiId.trim()) {
      this.toast.warning(this.translate.instant('PAYMENT.ERRORS.ENTER_UPI'));
      return;
    }

    if (this.paymentMethod() === 'card') {
      if (!this.cardNumber || !this.cardName || !this.cardExpiry || !this.cardCvv) {
        this.toast.warning(this.translate.instant('PAYMENT.ERRORS.FILL_CARD'));
        return;
      }
    }

    const finalData = {
      ...this.bookingData,
      totalPrice: this.finalPrice()
    };

    this.loading.set(true);

    setTimeout(() => {
      this.bookingService.bookTicket(finalData).subscribe({
        next: (res: any) => {
          this.loading.set(false);
          this.toast.success(this.translate.instant('PAYMENT.SUCCESS') || 'Payment Successful!');

          this.router.navigate(['/success'], {
            state: {
              ...history.state,
              bookingId: res.booking?._id,
              totalPrice: this.finalPrice(),
              discount: this.discountAmount()
            }
          });
        },
        error: (err: any) => {
          this.loading.set(false);
          this.toast.error(err?.error?.message || this.translate.instant('PAYMENT.ERRORS.PAYMENT_FAILED'));
        }
      });
    }, 1000);
  }

  selectMethod(method: 'upi' | 'card' | 'wallet'): void {
    this.paymentMethod.set(method);
  }

  goBack(): void {
    this.router.navigate(['/booking']);
  }

  feeAndTax(): number {
    return (this.fareSummary?.serviceFee || 0) + (this.fareSummary?.gst || 0);
  }
}