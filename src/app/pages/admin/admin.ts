import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin';
import { OfferService } from '../../services/offer.service';
import { BusService } from '../../services/bus';
import { AuthService } from '../../services/auth';
import { ToastService } from '../../services/toast.service';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './admin.html',
})
export class Admin implements OnInit {
  // Services
  adminService = inject(AdminService);
  offerService = inject(OfferService);
  busService = inject(BusService);
  authService = inject(AuthService);
  private toast = inject(ToastService);
  private translate = inject(TranslateService);

  // Tabs & Filters
  activeTab = signal<'dashboard' | 'reports' | 'users' | 'offers' | 'buses'>('dashboard');
  reportFilter = signal<'pending' | 'actioned' | 'dismissed' | 'all'>('pending');
  userFilter = signal<'' | 'verified' | 'unverified' | 'banned' | 'admin'>('');
  searchQuery = '';

  // --- BUS FORM STATE ---
  newBus = {
    busName: '',
    busNumber: '',
    source: '',
    destination: '',
    departureTime: '',
    arrivalTime: '',
    price: 0,
    totalSeats: 40,
    busType: 'AC Seater'
  };
  creatingBus = signal(false);

  // --- OFFER FORM STATE ---
  newOffer = {
    code: '',
    title: '',
    description: '',
    discountPercentage: 10,
    maxDiscountAmount: 100,
    validTill: ''
  };
  creatingOffer = signal(false);

  ngOnInit(): void {
    this.adminService.loadStats();
    this.adminService.loadReports(this.reportFilter());
    this.adminService.loadUsers();
  }

  setTab(tab: 'dashboard' | 'reports' | 'users' | 'offers' | 'buses') {
    this.activeTab.set(tab);
    if (tab === 'dashboard') this.adminService.loadStats();
    if (tab === 'reports') this.adminService.loadReports(this.reportFilter());
    if (tab === 'users') this.adminService.loadUsers();
    if (tab === 'offers') this.offerService.loadAllOffers();
    if (tab === 'buses') this.busService.getAllBuses();
  }

  // =====================
  // REPORT METHODS
  // =====================
  setReportFilter(filter: any) {
    this.reportFilter.set(filter);
    this.adminService.loadReports(filter);
  }

  reviewReport(id: string, action: string) {
    this.adminService.reviewReport(id, action).subscribe({
      next: () => {
        this.toast.success(`Action taken: ${action}`);
        this.adminService.loadReports(this.reportFilter());
        this.adminService.loadStats();
      },
      error: (err: any) => this.toast.error(err?.error?.message || 'Error')
    });
  }

  // =====================
  // USER METHODS
  // =====================
  setUserFilter(filter: any) {
    this.userFilter.set(filter);
    this.adminService.loadUsers(this.searchQuery, filter);
  }

  searchUsers() {
    this.adminService.loadUsers(this.searchQuery, this.userFilter());
  }

  toggleVerification(userId: string) {
    this.adminService.toggleVerification(userId).subscribe({
      next: () => {
        this.toast.success('Verification status updated');
        this.adminService.loadUsers(this.searchQuery, this.userFilter());
        this.adminService.loadStats();
      },
      error: (err: any) => this.toast.error(err?.error?.message || 'Error')
    });
  }

   toggleBan(userId: string) {
    this.toast.info('Updating user access status...', 'Updating');

    this.adminService.toggleBan(userId).subscribe({
      next: () => {
        this.toast.success('User ban status updated');
        this.adminService.loadUsers(this.searchQuery, this.userFilter());
        this.adminService.loadStats();
      },
      error: (err: any) => this.toast.error(err?.error?.message || 'Error updating status')
    });
  }
  changeRole(userId: string, event: Event) {
    const role = (event.target as HTMLSelectElement).value;
    this.adminService.changeRole(userId, role).subscribe({
      next: () => {
        this.toast.success('User role updated to ' + role);
        this.adminService.loadUsers(this.searchQuery, this.userFilter());
      },
      error: (err: any) => this.toast.error(err?.error?.message || 'Error')
    });
  }

  // =====================
  // OFFER METHODS
  // =====================
  createOffer(): void {
    if (!this.newOffer.code || !this.newOffer.title || !this.newOffer.validTill) {
      this.toast.warning('Please fill all required fields for offer');
      return;
    }
    this.creatingOffer.set(true);
    this.offerService.createOffer(this.newOffer).subscribe({
      next: () => {
        this.creatingOffer.set(false);
        this.toast.success('Offer created successfully!');
        this.newOffer = { code: '', title: '', description: '', discountPercentage: 10, maxDiscountAmount: 100, validTill: '' };
        this.offerService.loadAllOffers();
      },
      error: (err: any) => {
        this.creatingOffer.set(false);
        this.toast.error(err?.error?.message || 'Failed to create offer');
      }
    });
  }

   deleteOffer(id: string): void {
    // Alert ki jagah hum info toast dikhayenge ki process shuru ho gaya hai
    this.toast.info('Deleting offer, please wait...', 'Processing');

    this.offerService.deleteOffer(id).subscribe({
      next: () => {
        // Success Toast
        this.toast.success('Offer has been deleted successfully');
        this.offerService.loadAllOffers();
      },
      error: (err: any) => {
        // Error Toast
        this.toast.error(err?.error?.message || 'Failed to delete offer');
      }
    });
  }

  // =====================
  // BUS METHODS
  // =====================
  createBus() {
    if (!this.newBus.busName || !this.newBus.busNumber || !this.newBus.source || !this.newBus.destination) {
      this.toast.warning('Please fill all required fields for bus');
      return;
    }
    this.creatingBus.set(true);
    this.busService.addBus(this.newBus).subscribe({
      next: () => {
        this.creatingBus.set(false);
        this.toast.success('Bus added successfully!');
        this.newBus = { busName: '', busNumber: '', source: '', destination: '', departureTime: '', arrivalTime: '', price: 0, totalSeats: 40, busType: 'AC Seater' };
        this.busService.getAllBuses();
      },
      error: (err: any) => {
        this.creatingBus.set(false);
        this.toast.error(err?.error?.message || 'Failed to add bus');
      }
    });
  }

  // =====================
  // HELPERS
  // =====================
  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
      });
    } catch { return dateStr; }
  }
   deleteBus(busId: string): void {
    this.toast.info('Removing bus from schedule...', 'Processing');

    this.busService.deleteBus(busId).subscribe({
      next: () => {
        this.toast.success('Bus deleted successfully');
        this.busService.getAllBuses();
      },
      error: (err: any) => {
        this.toast.error(err?.error?.message || 'Failed to delete bus');
      }
    });
  }
}