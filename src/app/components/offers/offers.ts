import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OfferService } from '../../services/offer.service';
import { ToastService } from '../../services/toast.service';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-offers',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './offers.html',
  styleUrl: './offers.css'
})

export class Offers implements OnInit {
  offerService = inject(OfferService);
  private toast = inject(ToastService);

  // Premium card color themes – rotate after 5 cards
  offerCardThemes = [
    {
      gradient: 'from-red-500 to-red-600',
      headerText: 'text-red-100',
      border: 'border-red-200',
      badgeBg: 'bg-red-100 text-red-600',
      codeBg: 'bg-red-50 border-red-200 text-red-600',
      button: 'bg-red-600 hover:bg-red-700',
      iconBg: 'bg-red-100'
    },
    {
      gradient: 'from-blue-500 to-blue-600',
      headerText: 'text-blue-100',
      border: 'border-blue-200',
      badgeBg: 'bg-blue-100 text-blue-600',
      codeBg: 'bg-blue-50 border-blue-200 text-blue-600',
      button: 'bg-blue-600 hover:bg-blue-700',
      iconBg: 'bg-blue-100'
    },
    {
      gradient: 'from-emerald-500 to-emerald-600',
      headerText: 'text-emerald-100',
      border: 'border-emerald-200',
      badgeBg: 'bg-emerald-100 text-emerald-600',
      codeBg: 'bg-emerald-50 border-emerald-200 text-emerald-600',
      button: 'bg-emerald-600 hover:bg-emerald-700',
      iconBg: 'bg-emerald-100'
    },
    {
      gradient: 'from-amber-500 to-orange-500',
      headerText: 'text-amber-100',
      border: 'border-amber-200',
      badgeBg: 'bg-amber-100 text-amber-600',
      codeBg: 'bg-amber-50 border-amber-200 text-amber-600',
      button: 'bg-amber-600 hover:bg-amber-700',
      iconBg: 'bg-amber-100'
    },
    {
      gradient: 'from-violet-500 to-purple-600',
      headerText: 'text-violet-100',
      border: 'border-violet-200',
      badgeBg: 'bg-violet-100 text-violet-600',
      codeBg: 'bg-violet-50 border-violet-200 text-violet-600',
      button: 'bg-violet-600 hover:bg-violet-700',
      iconBg: 'bg-violet-100'
    }
  ];

  ngOnInit(): void {
    this.offerService.loadActiveOffers();
  }

  copyCode(code: string) {
    navigator.clipboard.writeText(code).then(() => {
      this.toast.success(`Code "${code}" copied to clipboard!`, 'Copied!');
    }).catch(() => {
      this.toast.error('Failed to copy code. Please copy manually.');
    });
  }

  getDaysLeft(validTill: string): number {
    const today = new Date();
    const expiry = new Date(validTill);
    const diff = expiry.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
}