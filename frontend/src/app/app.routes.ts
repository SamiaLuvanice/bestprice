import { Routes } from '@angular/router';

import { authGuard } from './core/auth/auth-guard';
import { guestGuard } from './core/auth/guest-guard';
export const routes: Routes = [
  {
    path: 'login',
    title: 'Entrar | My Bank',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login').then((module) => module.Login),
  },
  {
    path: 'dashboard',
    title: 'Página principal | My Bank',
    canActivate: [authGuard],
    runGuardsAndResolvers: 'always',
    loadComponent: () =>
      import('./features/dashboard/dashboard').then((module) => module.Dashboard),
  },
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: '**', redirectTo: 'dashboard' },
];
