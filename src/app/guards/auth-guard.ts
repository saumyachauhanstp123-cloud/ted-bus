import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth';

export const authGuard: CanActivateFn = (route, state) => {

  const router = inject(Router);
  const authService = inject(AuthService);

  if (authService.isLoggedIn()) {
    return true;
  }

  // 🔥 returnUrl save karo — login ke baad user yahi wapas aayega
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url }
  });
};