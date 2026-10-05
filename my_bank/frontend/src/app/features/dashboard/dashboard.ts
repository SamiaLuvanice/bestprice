import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { AuthFailure } from '../../core/auth/auth.model';

@Component({
  selector: 'app-dashboard',
  imports: [],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly error = signal<string | null>(null);

  protected logout(): void {
    if (this.auth.pending()) return;
    this.error.set(null);
    this.auth
      .logout()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          void this.router.navigateByUrl('/login', { replaceUrl: true });
        },
        error: (failure: AuthFailure) => this.error.set(failure.message),
      });
  }

  @HostListener('window:pageshow', ['$event'])
  protected restorePage(event: PageTransitionEvent): void {
    if (!event.persisted) return;
    this.auth
      .recoverSession()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((state) => {
        if (state.status !== 'authenticated')
          void this.router.navigateByUrl('/login', { replaceUrl: true });
      });
  }
}
