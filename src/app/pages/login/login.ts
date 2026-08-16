import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  Router,
  ActivatedRoute,
  RouterLink
} from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    CommonModule,
    TranslatePipe
  ],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {

  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private translate = inject(TranslateService);
  private toast = inject(ToastService);

  email = '';
  password = '';

  loading = signal(false);
  errorMessage = signal('');
  showPassword = signal(false);
  rememberMe = signal(false);

  login(): void {
    if (!this.email.trim() || !this.password.trim()) {
      this.errorMessage.set(this.translate.instant('AUTH.ERRORS.FILL_ALL'));
      this.toast.warning(this.translate.instant('AUTH.ERRORS.FILL_ALL'));
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.authService.login({
      email: this.email,
      password: this.password
    }).subscribe({
      next: () => {
        this.loading.set(false);
        this.toast.success(this.translate.instant('AUTH.LOGIN_SUCCESS'));
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/';
        this.router.navigateByUrl(returnUrl);
      },
      error: (error: any) => {
        this.loading.set(false);

        if (error.error?.needsVerification) {
          this.toast.warning('Please verify your email first. Redirecting...');
          setTimeout(() => {
            this.router.navigate(['/register'], {
              state: { email: error.error.email, step: 2 }
            });
          }, 1200);
          return;
        }

        const msg = error.error?.message || this.translate.instant('AUTH.ERRORS.LOGIN_FAILED');
        this.errorMessage.set(msg);
        this.toast.error(msg);
      }
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }
}