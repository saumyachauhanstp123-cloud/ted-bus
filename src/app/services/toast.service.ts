import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: number;
  type: ToastType;
  title: string;
  message: string;
  duration: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  toasts = signal<Toast[]>([]);

  private nextId = 1;

  show(
    message: string,
    type: ToastType = 'success',
    title = '',
    duration = 4500
  ) {
    const id = this.nextId++;

    const toast: Toast = {
      id,
      type,
      title: title || this.getDefaultTitle(type),
      message,
      duration
    };

    this.toasts.update((current) => [toast, ...current]);

    if (duration > 0) {
      setTimeout(() => this.remove(id), duration);
    }
  }

  success(message: string, title = 'Success') {
    this.show(message, 'success', title, 4000);
  }

  error(message: string, title = 'Error') {
    this.show(message, 'error', title, 6000);
  }

  warning(message: string, title = 'Warning') {
    this.show(message, 'warning', title, 5000);
  }

  info(message: string, title = 'Info') {
    this.show(message, 'info', title, 4000);
  }

  remove(id: number) {
    this.toasts.update((toasts) => toasts.filter((t) => t.id !== id));
  }

  private getDefaultTitle(type: ToastType): string {
    const titles = {
      success: 'Success',
      error: 'Error',
      warning: 'Warning',
      info: 'Information'
    };
    return titles[type];
  }
}