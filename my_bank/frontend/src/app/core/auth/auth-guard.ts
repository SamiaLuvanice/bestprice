import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  return inject(AuthService)
    .recoverSession()
    .pipe(map((state) => (state.status === 'authenticated' ? true : router.parseUrl('/login'))));
};
