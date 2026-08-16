import { Injectable, signal, computed } from '@angular/core';

export type AppTheme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private storageKey = 'ted-bus-theme';

  currentTheme = signal<AppTheme>('light');
  isDark = computed(() => this.currentTheme() === 'dark');

  initializeTheme(): void {
    const savedTheme = localStorage.getItem(this.storageKey) as AppTheme | null;

    if (savedTheme === 'dark' || savedTheme === 'light') {
      this.applyTheme(savedTheme);
    } else {
      // default fallback
      this.applyTheme('light');
    }
  }

  toggleTheme(): void {
    const nextTheme: AppTheme = this.currentTheme() === 'light' ? 'dark' : 'light';
    this.applyTheme(nextTheme);
  }

  setTheme(theme: AppTheme): void {
    this.applyTheme(theme);
  }

  getTheme(): AppTheme {
    return this.currentTheme();
  }

  private applyTheme(theme: AppTheme): void {
    this.currentTheme.set(theme);
    localStorage.setItem(this.storageKey, theme);

    const html = document.documentElement;
    const body = document.body;

    if (theme === 'dark') {
      html.classList.add('dark');
      body.classList.add('dark-theme');
    } else {
      html.classList.remove('dark');
      body.classList.remove('dark-theme');
    }
  }
}