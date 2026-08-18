import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { catchError, map, of } from 'rxjs';

import { AdminAuthService } from '../services/admin-auth.service';

export const guestAdminGuard: CanActivateFn = () => {
  const authService = inject(AdminAuthService);
  const router = inject(Router);

  return authService.me().pipe(
    map(() => router.createUrlTree(['/admin'])),

    catchError(() => of(true)),
  );
};
