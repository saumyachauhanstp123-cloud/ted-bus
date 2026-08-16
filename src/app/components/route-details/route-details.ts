import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { ReviewService, RouteReview } from '../../services/review';
import { AuthService } from '../../services/auth';
import { ToastService } from '../../services/toast.service';
@Component({
  selector: 'app-route-details',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './route-details.html',
  styleUrl: './route-details.css'
})
export class RouteDetails implements OnInit {
  private router = inject(Router);
  private reviewService = inject(ReviewService);
   authService = inject(AuthService);
  private translate = inject(TranslateService);
  private toast = inject(ToastService);

  selectedBus: any = null;

  reviews = signal<RouteReview[]>([]);
  averageRating = signal(0);
  totalReviews = signal(0);

  eligibleBookings = signal<any[]>([]);

  rating = 0;
  reviewText = '';
  selectedBookingId = '';

  editingReviewId: string | null = null;

  submitting = signal(false);
  loadingReviews = signal(false);
  activeTab = signal<'info' | 'reviews'>('info');
  errorMessage = signal('');
  successMessage = signal('');

  ngOnInit(): void {
    this.selectedBus = history.state.selectedBus;

    if (!this.selectedBus?._id) {
      this.router.navigate(['/route-planner']);
      return;
    }

    this.loadReviews();

    if (this.authService.isLoggedIn()) {
      this.loadEligibleBookings();
    }
  }

  goBack(): void {
    this.router.navigate(['/route-planner']);
  }

  bookThisBus(): void {
    this.router.navigate(['/booking'], {
      state: {
        selectedBus: this.selectedBus,
        journeyDate: new Date().toISOString().split('T')[0]
      }
    });
  }

  loadReviews(): void {
    this.loadingReviews.set(true);

    this.reviewService.getRouteReviews(this.selectedBus._id).subscribe({
      next: (res: any) => {
        this.averageRating.set(res.averageRating || 0);
        this.totalReviews.set(res.totalReviews || 0);
        this.reviews.set(res.reviews || []);
        this.loadingReviews.set(false);
      },
      error: () => {
        this.loadingReviews.set(false);
      }
    });
  }

  loadEligibleBookings(): void {
    this.reviewService.getEligibleBookings(this.selectedBus._id).subscribe({
      next: (res: any) => {
        this.eligibleBookings.set(res.eligibleBookings || []);
        if (res.eligibleBookings?.length) {
          this.selectedBookingId = res.eligibleBookings[0]._id;
        }
      },
      error: () => {
        this.eligibleBookings.set([]);
      }
    });
  }

  setRating(value: number): void {
    this.rating = value;
  }

  submitReview(): void {
    this.errorMessage.set('');
    this.successMessage.set('');

    if (!this.authService.currentUser()?.isVerified) {
      this.errorMessage.set('Only verified users can post reviews.');
      return;
    }

    if (!this.editingReviewId && !this.selectedBookingId) {
      this.errorMessage.set('You can review this route only after completing a journey.');
      return;
    }

    if (this.rating < 1 || this.rating > 5) {
      this.errorMessage.set(this.translate.instant('ROUTE_DETAILS.ERRORS.SELECT_RATING'));
      return;
    }

    if (this.reviewText.trim().length < 20) {
      this.errorMessage.set('Review must be at least 20 characters long.');
      return;
    }

    this.submitting.set(true);

    if (this.editingReviewId) {
      this.reviewService.updateReview(this.editingReviewId, {
        rating: this.rating,
        reviewText: this.reviewText
      }).subscribe({
        next: () => {
          this.submitting.set(false);
          this.successMessage.set('Review updated successfully.');
          this.resetForm();
          this.loadReviews();
        },
        error: (err: any) => {
          this.submitting.set(false);
          this.errorMessage.set(err?.error?.message || 'Failed to update review.');
        }
      });

      return;
    }

    this.reviewService.createReview({
      bookingId: this.selectedBookingId,
      rating: this.rating,
      reviewText: this.reviewText
    }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.successMessage.set('Review submitted successfully.');
        this.resetForm();
        this.loadReviews();
        this.loadEligibleBookings();
      },
      error: (err: any) => {
        this.submitting.set(false);
        this.errorMessage.set(err?.error?.message || 'Failed to submit review.');
      }
    });
  }

  startEdit(review: RouteReview): void {
    if (!this.canEdit(review)) {
      this.errorMessage.set('You can edit a review only within 24 hours.');
      return;
    }

    this.editingReviewId = review._id;
    this.rating = review.rating;
    this.reviewText = review.reviewText;
  }

  cancelEdit(): void {
    this.resetForm();
  }

  private resetForm(): void {
    this.editingReviewId = null;
    this.rating = 0;
    this.reviewText = '';
  }

  canEdit(review: RouteReview): boolean {
    const userId = this.authService.currentUser()?._id;
    if (review.user?._id !== userId) return false;

    const hoursPassed =
      (Date.now() - new Date(review.createdAt).getTime()) / (1000 * 60 * 60);

    return hoursPassed <= 24;
  }

    markHelpful(review: RouteReview): void {
    this.reviewService.markHelpful(review._id).subscribe({
      next: () => {
        this.loadReviews();
        this.toast.success('Marked as helpful! 👍');
      },
      error: (err: any) => {
        this.toast.error(err?.error?.message || 'Failed.');
      }
    });
  }

  reportReview(review: RouteReview): void {
    const reason = prompt('Report reason: spam, abuse, fake, inappropriate, other');
    if (!reason) return;

    this.reviewService.reportReview(review._id, reason).subscribe({
      next: () => {
        this.successMessage.set('Review reported successfully.');
        this.loadReviews();
      },
      error: (err: any) => {
        this.errorMessage.set(err?.error?.message || 'Failed to report review.');
      }
    });
  }

  getStars(rating: number): number[] {
    return Array.from({ length: rating }, (_, i) => i + 1);
  }

  getEmptyStars(rating: number): number[] {
    return Array.from({ length: 5 - rating }, (_, i) => i + 1);
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