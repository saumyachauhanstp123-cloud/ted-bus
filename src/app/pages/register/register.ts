import {
  Component,
  inject,
  OnDestroy,
  signal
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  TranslatePipe,
  TranslateService
} from '@ngx-translate/core';

import { AuthService } from '../../services/auth';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    TranslatePipe
  ],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register implements OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private toast = inject(ToastService);

  // Registration fields
  name = '';
  email = '';
  phone = '';
  password = '';
  confirmPassword = '';
  acceptTerms = false;

  // OTP fields
  otpDigits: string[] = ['', '', '', '', '', ''];

  // UI state
  step = signal<1 | 2>(1);
  loading = signal(false);
  showPassword = signal(false);
  showConfirmPassword = signal(false);
  passwordErrorKey = signal('');

  // OTP timers
  otpExpiryTime = signal(600);
  resendCooldown = signal(0);

  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private cooldownInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    const state = history.state;

    /*
     * Login page se unverified user redirect hone par
     * direct OTP screen khulegi aur fresh OTP send hogi.
     */
    if (state?.email && state?.step === 2) {
      this.email = state.email;
      this.step.set(2);

      window.setTimeout(() => {
        this.resendOtp(true);
      }, 0);
    }
  }

  ngOnDestroy(): void {
    this.clearTimers();
  }

  validatePassword(): void {
    if (!this.password) {
      this.passwordErrorKey.set('');
      return;
    }

    if (this.password.length < 6) {
      this.passwordErrorKey.set('AUTH.ERRORS.PASSWORD_MIN');
      return;
    }

    this.passwordErrorKey.set('');
  }

  passwordStrength(): 0 | 1 | 2 | 3 {
    if (!this.password) {
      return 0;
    }

    let score = 0;

    if (this.password.length >= 6) {
      score++;
    }

    if (
      this.password.length >= 8 &&
      /[A-Z]/.test(this.password) &&
      /[0-9]/.test(this.password)
    ) {
      score++;
    }

    if (
      this.password.length >= 10 &&
      /[a-z]/.test(this.password) &&
      /[A-Z]/.test(this.password) &&
      /[0-9]/.test(this.password) &&
      /[^A-Za-z0-9]/.test(this.password)
    ) {
      score++;
    }

    return score as 0 | 1 | 2 | 3;
  }

  passwordStrengthKey(): string {
    const strength = this.passwordStrength();

    if (strength === 1) {
      return 'AUTH.PASSWORD_WEAK';
    }

    if (strength === 2) {
      return 'AUTH.PASSWORD_MEDIUM';
    }

    if (strength === 3) {
      return 'AUTH.PASSWORD_STRONG';
    }

    return '';
  }

  register(): void {
    const name = this.name.trim();
    const email = this.email.trim().toLowerCase();
    const phone = this.phone.trim();

    if (!name || !email || !this.password) {
      this.toast.warning(
        this.translate.instant('AUTH.ERRORS.FILL_ALL')
      );
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      this.toast.warning(
        this.translate.instant('AUTH.ERRORS.EMAIL_INVALID')
      );
      return;
    }

    if (phone && !/^[6-9]\d{9}$/.test(phone)) {
      this.toast.warning(
        this.translate.instant('AUTH.ERRORS.INVALID_PHONE')
      );
      return;
    }

    if (this.password.length < 6) {
      this.passwordErrorKey.set('AUTH.ERRORS.PASSWORD_MIN');

      this.toast.warning(
        this.translate.instant('AUTH.ERRORS.PASSWORD_MIN')
      );
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.toast.warning(
        this.translate.instant('AUTH.ERRORS.PASSWORD_MISMATCH')
      );
      return;
    }

    if (!this.acceptTerms) {
      this.toast.warning(
        this.translate.instant('AUTH.ERRORS.ACCEPT_TERMS')
      );
      return;
    }

    this.loading.set(true);

    this.authService.register({
      name,
      email,
      password: this.password,
      phone
    }).subscribe({
      next: (response) => {
        this.loading.set(false);

        this.email = response.email || email;
        this.step.set(2);
        this.resetOtpFields();
        this.startOtpTimer();
        this.startResendCooldown();

        this.toast.success(
          response.message ||
          this.translate.instant('AUTH.OTP_SENT')
        );
      },

      error: (error: any) => {
        this.loading.set(false);

        this.toast.error(
          error?.error?.message ||
          this.translate.instant('AUTH.ERRORS.REGISTER_FAILED')
        );
      }
    });
  }

  onOtpInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;

    const value = input.value
      .replace(/\D/g, '')
      .slice(-1);

    input.value = value;
    this.otpDigits[index] = value;

    if (value && index < 5) {
      this.focusOtpInput(index + 1);
    }
  }

  onOtpKeydown(event: KeyboardEvent, index: number): void {
    const input = event.target as HTMLInputElement;

    if (
      event.key === 'Backspace' &&
      !input.value &&
      index > 0
    ) {
      this.focusOtpInput(index - 1);
    }

    if (
      !/^\d$/.test(event.key) &&
      ![
        'Backspace',
        'Delete',
        'Tab',
        'ArrowLeft',
        'ArrowRight'
      ].includes(event.key)
    ) {
      event.preventDefault();
    }
  }

  onOtpPaste(event: ClipboardEvent): void {
    event.preventDefault();

    const pastedValue = event.clipboardData
      ?.getData('text')
      .replace(/\D/g, '')
      .slice(0, 6);

    if (!pastedValue) {
      return;
    }

    this.otpDigits = Array.from(
      { length: 6 },
      (_, index) => pastedValue[index] || ''
    );

    window.setTimeout(() => {
      const lastIndex = Math.min(pastedValue.length, 6) - 1;
      this.focusOtpInput(Math.max(lastIndex, 0));
    });
  }

  otpCode(): string {
    return this.otpDigits.join('');
  }

  verifyOtp(): void {
    const otp = this.otpCode();

    if (!/^\d{6}$/.test(otp)) {
      this.toast.warning(
        this.translate.instant('AUTH.ERRORS.INVALID_OTP')
      );
      return;
    }

    if (this.otpExpiryTime() <= 0) {
      this.toast.error(
        this.translate.instant('AUTH.ERRORS.OTP_EXPIRED')
      );
      return;
    }

    this.loading.set(true);

    this.authService.verifyOTP(this.email, otp).subscribe({
      next: () => {
        this.loading.set(false);
        this.clearTimers();

        this.toast.success(
          this.translate.instant('AUTH.OTP_VERIFIED')
        );

        this.router.navigate(['/']);
      },

      error: (error: any) => {
        this.loading.set(false);

        this.toast.error(
          error?.error?.message ||
          this.translate.instant('AUTH.ERRORS.INVALID_OTP')
        );
      }
    });
  }

  resendOtp(silent = false): void {
    if (this.resendCooldown() > 0 && !silent) {
      this.toast.warning(
        this.translate.instant(
          'AUTH.RESEND_WAIT',
          { seconds: this.resendCooldown() }
        )
      );
      return;
    }

    this.loading.set(true);

    this.authService.resendOTP(this.email).subscribe({
      next: () => {
        this.loading.set(false);

        this.resetOtpFields();
        this.startOtpTimer();
        this.startResendCooldown();

        this.toast.info(
          this.translate.instant('AUTH.OTP_RESENT')
        );

        window.setTimeout(() => {
          this.focusOtpInput(0);
        });
      },

      error: (error: any) => {
        this.loading.set(false);

        this.toast.error(
          error?.error?.message ||
          this.translate.instant('AUTH.ERRORS.RESEND_FAILED')
        );
      }
    });
  }

  private startOtpTimer(): void {
    this.clearOtpTimer();
    this.otpExpiryTime.set(600);

    this.timerInterval = setInterval(() => {
      const current = this.otpExpiryTime();

      if (current <= 1) {
        this.otpExpiryTime.set(0);
        this.clearOtpTimer();
        return;
      }

      this.otpExpiryTime.set(current - 1);
    }, 1000);
  }

  private startResendCooldown(): void {
    this.clearCooldown();
    this.resendCooldown.set(30);

    this.cooldownInterval = setInterval(() => {
      const current = this.resendCooldown();

      if (current <= 1) {
        this.resendCooldown.set(0);
        this.clearCooldown();
        return;
      }

      this.resendCooldown.set(current - 1);
    }, 1000);
  }

  private focusOtpInput(index: number): void {
    const element = document.getElementById(
      `otp-input-${index}`
    ) as HTMLInputElement | null;

    element?.focus();
    element?.select();
  }

  private resetOtpFields(): void {
    this.otpDigits = ['', '', '', '', '', ''];
  }

  private clearOtpTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private clearCooldown(): void {
    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval);
      this.cooldownInterval = null;
    }
  }

  private clearTimers(): void {
    this.clearOtpTimer();
    this.clearCooldown();
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds
      .toString()
      .padStart(2, '0')}`;
  }

  otpProgressPercent(): number {
    return Math.max(
      0,
      Math.min(100, (this.otpExpiryTime() / 600) * 100)
    );
  }

  goBackToRegister(): void {
    this.step.set(1);
    this.resetOtpFields();
    this.clearTimers();
  }
}