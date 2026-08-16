import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingService } from '../../services/loading.service';

@Component({
  selector: 'app-loading-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (loadingService.isLoading()) {
      <div class="fixed top-0 left-0 right-0 z-[10000] h-1 bg-red-100 overflow-hidden">
        <div class="h-full bg-gradient-to-r from-red-500 via-red-600 to-red-500 animate-loading-bar"></div>
      </div>
    }
  `,
  styles: [`
    @keyframes loadingSlide {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
    .animate-loading-bar {
      animation: loadingSlide 1.2s ease-in-out infinite;
      width: 40%;
    }
  `]
})
export class LoadingBar {
  loadingService = inject(LoadingService);
}