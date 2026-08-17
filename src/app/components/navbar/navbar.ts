import {
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  OnInit,
  signal
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  RouterLink,
  RouterLinkActive
} from '@angular/router';

import {
  TranslatePipe
} from '@ngx-translate/core';

import {
  AuthService
} from '../../services/auth';

import {
  NotificationService
} from '../../services/notification';

import {
  ThemeService
} from '../../services/theme.service';

import {
  LanguageService
} from '../../services/language.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    TranslatePipe
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar implements OnInit {
  private readonly auth =
    inject(AuthService);

  private readonly notificationService =
    inject(NotificationService);

  private readonly themeService =
    inject(ThemeService);

  private readonly languageService =
    inject(LanguageService);

  private readonly elementRef =
    inject(ElementRef<HTMLElement>);

  // Authentication state
  readonly isLoggedIn =
    this.auth.isLoggedIn;

  readonly currentUser =
    this.auth.currentUser;

  // Theme state
  readonly currentTheme =
    this.themeService.currentTheme;

  readonly isDark =
    this.themeService.isDark;

  // Language state
  readonly selectedLanguage =
    this.languageService.currentLanguage;

  // Navbar UI state
  readonly mobileMenuOpen =
    signal(false);

  readonly showAccountMenu =
    signal(false);

  readonly unreadCount =
    this.notificationService.unreadCount;

  // User role
  readonly isAdminOrModerator =
    computed(() => {
      const role =
        this.currentUser()?.role;

      return (
        role === 'admin' ||
        role === 'moderator'
      );
    });

  // User initial
  readonly userInitial =
    computed(() => {
      const name =
        this.currentUser()?.name || 'U';

      return name
        .charAt(0)
        .toUpperCase();
    });

  // Avatar state
  readonly hasAvatar =
    computed(() => {
      const avatar =
        this.currentUser()?.avatar;

      return (
        typeof avatar === 'string' &&
        avatar.trim() !== ''
      );
    });

  ngOnInit(): void {
    if (this.isLoggedIn()) {
      this.notificationService
        .refreshUnreadCount();
    }
  }

  /**
   * Navbar ke bahar click karne par
   * account aur mobile menu close honge.
   */
  @HostListener(
    'document:click',
    ['$event']
  )
  onDocumentClick(
    event: MouseEvent
  ): void {
    const target =
      event.target as Node;

    if (
      !this.elementRef
        .nativeElement
        .contains(target)
    ) {
      this.closeMenus();
    }
  }

  /**
   * Mobile/tablet navigation open/close.
   */
  toggleMobileMenu(
    event?: MouseEvent
  ): void {
    event?.stopPropagation();

    this.mobileMenuOpen.update(
      open => !open
    );

    this.showAccountMenu.set(false);
  }

  /**
   * Desktop account dropdown open/close.
   */
  toggleAccountMenu(
    event?: MouseEvent
  ): void {
    event?.stopPropagation();

    this.showAccountMenu.update(
      open => !open
    );

    this.mobileMenuOpen.set(false);
  }

  /**
   * Saare navbar menus close.
   */
  closeMenus(): void {
    this.mobileMenuOpen.set(false);
    this.showAccountMenu.set(false);
  }

  /**
   * User logout.
   */
  logout(): void {
    this.closeMenus();
    this.auth.logout();
  }

  /**
   * Light/dark theme change.
   */
  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  /**
   * English/Hindi language change.
   */
  changeLanguage(
    event: Event
  ): void {
    const select =
      event.target as HTMLSelectElement;

    const language =
      select.value as 'en' | 'hi';

    this.languageService.setLanguage(
      language,
      true
    );
  }
}