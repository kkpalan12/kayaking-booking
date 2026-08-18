import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { catchError, map, of } from 'rxjs';

import { AdminAuthService } from '../services/admin-auth.service';

export const adminAuthGuard: CanActivateFn = () => {
  const authService = inject(AdminAuthService);

  const router = inject(Router);

  return authService.me().pipe(
    map(() => true),

    catchError(() => {
      return of(router.createUrlTree(['/admin/login']));
    }),
  );
};
