import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from './auth.service';

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const status = auth.state().status;
  if (status === 'anonymous' || status === 'unavailable') return true;
  if (status === 'authenticated') return router.parseUrl('/dashboard');
  return auth
    .recoverSession()
    .pipe(
      map((state) => (state.status === 'authenticated' ? router.parseUrl('/dashboard') : true)),
    );
};
