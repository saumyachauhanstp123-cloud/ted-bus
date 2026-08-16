import {
  Component,
  inject,
  signal,
  ElementRef,
  HostListener,
  OnInit,
  computed
} from '@angular/core';
import {
  RouterLink,
  RouterLinkActive
} from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '../../services/auth';
import { NotificationService } from '../../services/notification';
import { ThemeService } from '../../services/theme.service';
import {
  LanguageService
} from '../../services/language.service';
@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule, TranslatePipe],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar implements OnInit {
  private auth = inject(AuthService);
  private notificationService = inject(NotificationService);
  private themeService = inject(ThemeService);
  private el = inject(ElementRef);
  private readonly languageService =
  inject(LanguageService);

selectedLanguage =
  this.languageService.currentLanguage;

  isLoggedIn = this.auth.isLoggedIn;
  currentUser = this.auth.currentUser;

  mobileMenuOpen = signal(false);
  showAccountMenu = signal(false);
  unreadCount = this.notificationService.unreadCount;
  

  currentTheme = this.themeService.currentTheme;
  isDark = this.themeService.isDark;

  // Premium helper states
  isAdminOrModerator = computed(() => {
    const role = this.currentUser()?.role;
    return role === 'admin' || role === 'moderator';
  });

  userInitial = computed(() => {
    const name = this.currentUser()?.name || 'U';
    return name.charAt(0).toUpperCase();
  });

  hasAvatar = computed(() => {
    const avatar = this.currentUser()?.avatar;
    return !!avatar && avatar.trim() !== '';
  });

  ngOnInit(): void {
    if (this.isLoggedIn()) {
      this.notificationService.refreshUnreadCount();
    }
    this.selectedLanguage.set(this.languageService.getLanguage());
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as Node;
    if (!this.el.nativeElement.contains(target)) {
      this.showAccountMenu.set(false);
      this.mobileMenuOpen.set(false);
    }
  }

  toggleMobileMenu(event?: MouseEvent): void {
    event?.stopPropagation();
    this.mobileMenuOpen.update(v => !v);
    this.showAccountMenu.set(false);
  }

  toggleAccountMenu(event?: MouseEvent): void {
    event?.stopPropagation();
    this.showAccountMenu.update(v => !v);
    this.mobileMenuOpen.set(false);
  }

  closeMenus(): void {
    this.mobileMenuOpen.set(false);
    this.showAccountMenu.set(false);
  }

  logout(): void {
    this.closeMenus();
    this.auth.logout();
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  changeLanguage(event: Event): void {
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