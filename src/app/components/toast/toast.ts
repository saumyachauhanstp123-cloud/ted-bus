import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed bottom-6 right-6 z-[9999] flex flex-col-reverse gap-3 sm:w-96">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="flex items-start gap-3 px-5 py-4 rounded-2xl shadow-2xl border animate-toast-slide-in"
          [ngClass]="{
            'bg-emerald-50 border-emerald-200 text-emerald-800': toast.type === 'success',
            'bg-red-50 border-red-200 text-red-800': toast.type === 'error',
            'bg-amber-50 border-amber-200 text-amber-800': toast.type === 'warning',
            'bg-blue-50 border-blue-200 text-blue-800': toast.type === 'info'
          }">

          <span class="text-2xl mt-0.5 flex-shrink-0">
            @if (toast.type === 'success') { ✅ }
            @if (toast.type === 'error') { ❌ }
            @if (toast.type === 'warning') { ⚠️ }
            @if (toast.type === 'info') { ℹ️ }
          </span>

          <div class="flex-1 min-w-0 pt-0.5">
            <p class="font-semibold text-sm">{{ toast.title }}</p>
            <p class="text-sm mt-1 leading-tight">{{ toast.message }}</p>
          </div>

          <button
            (click)="toastService.remove(toast.id)"
            class="text-current opacity-60 hover:opacity-100 text-2xl leading-none -mt-1">
            ×
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes toastSlideIn {
      from { transform: translateX(120%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    .animate-toast-slide-in {
      animation: toastSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
  `]
})
export class Toast {
  toastService = inject(ToastService);
}