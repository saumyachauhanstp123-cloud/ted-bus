import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-features',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './features.html',
  styleUrl: './features.css'
})
export class Features {
  features = [
  {
    icon: '🎫',
    title: 'Easy Booking',
    description:
      'Book your bus tickets quickly with a smooth and simple booking experience.',
    color:
      'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    cardColor: 'feature-red'
  },
  {
    icon: '🛡️',
    title: 'Secure Payments',
    description:
      'Your transactions are protected with secure and reliable payment methods.',
    color:
      'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    cardColor: 'feature-blue'
  },
  {
    icon: '🗺️',
    title: 'Smart Route Planning',
    description:
      'Find better routes and plan your journey with intelligent travel tools.',
    color:
      'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    cardColor: 'feature-emerald'
  },
  {
    icon: '⚡',
    title: 'Fast Experience',
    description:
      'Enjoy a fast, responsive and hassle-free travel booking experience.',
    color:
      'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    cardColor: 'feature-amber'
  },
  {
    icon: '🌍',
    title: 'Travel Community',
    description:
      'Connect with fellow travelers and share useful travel information.',
    color:
      'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
    cardColor: 'feature-violet'
  },
  {
    icon: '💬',
    title: '24/7 Support',
    description:
      'Our support team is always available to help you whenever you need us.',
    color:
      'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
    cardColor: 'feature-pink'
  }
];
}