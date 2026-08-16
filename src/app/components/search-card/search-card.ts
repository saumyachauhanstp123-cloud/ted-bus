import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BusService } from '../../services/bus';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-search-card',
  standalone: true,
  imports: [FormsModule, CommonModule, TranslatePipe],
  templateUrl: './search-card.html',
  styleUrl: './search-card.css',
})
export class SearchCard {
  private router = inject(Router);
  private busService = inject(BusService);
  private translate = inject(TranslateService);

  from = '';
  to = '';
  journeyDate = '';

  loading = signal(false);
  errorMessage = signal('');
  showResults = signal(false);
  buses = signal<any[]>([]);

  minDate = new Date().toISOString().split('T')[0];
  busCardThemes = [
    {
      accentBar: 'from-red-500 via-red-400 to-orange-300',
      iconBg: 'bg-red-50 dark:bg-red-900/20',
      iconText: 'text-red-600 dark:text-red-400',
      hoverBorder: 'hover:border-red-200 dark:hover:border-red-800',
      hoverShadow: 'hover:shadow-red-100 dark:hover:shadow-red-900/20',
      priceColor: 'text-red-600 dark:text-red-400',
      buttonGradient: 'from-red-600 to-red-700 hover:from-red-700 hover:to-red-800',
      buttonShadow: 'hover:shadow-red-200 dark:hover:shadow-red-900/30'
    },
    {
      accentBar: 'from-blue-500 via-blue-400 to-cyan-300',
      iconBg: 'bg-blue-50 dark:bg-blue-900/20',
      iconText: 'text-blue-600 dark:text-blue-400',
      hoverBorder: 'hover:border-blue-200 dark:hover:border-blue-800',
      hoverShadow: 'hover:shadow-blue-100 dark:hover:shadow-blue-900/20',
      priceColor: 'text-blue-600 dark:text-blue-400',
      buttonGradient: 'from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800',
      buttonShadow: 'hover:shadow-blue-200 dark:hover:shadow-blue-900/30'
    },
    {
      accentBar: 'from-emerald-500 via-emerald-400 to-teal-300',
      iconBg: 'bg-emerald-50 dark:bg-emerald-900/20',
      iconText: 'text-emerald-600 dark:text-emerald-400',
      hoverBorder: 'hover:border-emerald-200 dark:hover:border-emerald-800',
      hoverShadow: 'hover:shadow-emerald-100 dark:hover:shadow-emerald-900/20',
      priceColor: 'text-emerald-600 dark:text-emerald-400',
      buttonGradient: 'from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800',
      buttonShadow: 'hover:shadow-emerald-200 dark:hover:shadow-emerald-900/30'
    },
    {
      accentBar: 'from-amber-500 via-amber-400 to-yellow-300',
      iconBg: 'bg-amber-50 dark:bg-amber-900/20',
      iconText: 'text-amber-600 dark:text-amber-400',
      hoverBorder: 'hover:border-amber-200 dark:hover:border-amber-800',
      hoverShadow: 'hover:shadow-amber-100 dark:hover:shadow-amber-900/20',
      priceColor: 'text-amber-600 dark:text-amber-400',
      buttonGradient: 'from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700',
      buttonShadow: 'hover:shadow-amber-200 dark:hover:shadow-amber-900/30'
    },
    {
      accentBar: 'from-violet-500 via-violet-400 to-purple-300',
      iconBg: 'bg-violet-50 dark:bg-violet-900/20',
      iconText: 'text-violet-600 dark:text-violet-400',
      hoverBorder: 'hover:border-violet-200 dark:hover:border-violet-800',
      hoverShadow: 'hover:shadow-violet-100 dark:hover:shadow-violet-900/20',
      priceColor: 'text-violet-600 dark:text-violet-400',
      buttonGradient: 'from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800',
      buttonShadow: 'hover:shadow-violet-200 dark:hover:shadow-violet-900/30'
    }
  ];
  searchBus(): void {
    const from = this.from.trim();
    const to = this.to.trim();
    const journeyDate = this.journeyDate;

    if (!from || !to || !journeyDate) {
      this.errorMessage.set(this.translate.instant('SEARCH.ERRORS.FILL_ALL'));
      this.showResults.set(false);
      return;
    }

    const cityPattern = /^[A-Za-z\s]+$/;
    if (!cityPattern.test(from) || !cityPattern.test(to)) {
      this.errorMessage.set(this.translate.instant('SEARCH.ERRORS.LETTERS_ONLY'));
      this.showResults.set(false);
      return;
    }

    if (from.toLowerCase() === to.toLowerCase()) {
      this.errorMessage.set(this.translate.instant('SEARCH.ERRORS.SAME_CITY'));
      this.showResults.set(false);
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    this.showResults.set(false);

    this.busService.searchBuses(from, to).subscribe({
      next: (response: any) => {
        this.loading.set(false);

        const list = response?.buses || response || [];
        this.buses.set(list);
        this.showResults.set(list.length > 0);

        if (list.length === 0) {
          this.errorMessage.set(this.translate.instant('SEARCH.NO_BUSES'));
        }
      },
      error: (error) => {
        console.error(error);
        this.loading.set(false);
        this.showResults.set(false);
        this.errorMessage.set(this.translate.instant('SEARCH.ERRORS.SOMETHING_WRONG'));
      },
    });
  }

  swapCities(): void {
    const temp = this.from;
    this.from = this.to;
    this.to = temp;
  }

  bookSeat(bus: any): void {
    this.router.navigate(['/booking'], {
      state: {
        selectedBus: bus,
        journeyDate: this.journeyDate,
      },
    });
  }

  viewRouteDetails(bus: any): void {
    this.router.navigate(['/route-details'], {
      state: {
        selectedBus: bus,
      },
    });
  }
}