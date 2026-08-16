import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.currentUser();

  if (user && (user.role === 'admin' || user.role === 'moderator')) {
    return true;
  }

  router.navigate(['/']);
  return false;
};