import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { AuthFailure } from '../../../core/auth/auth.model';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly builder = inject(NonNullableFormBuilder);
  protected readonly failure = signal<AuthFailure | null>(null);
  protected sessionMessage(): string | undefined {
    const state = this.auth.state();
    return state.status === 'anonymous' ? state.message : undefined;
  }
  protected readonly form = this.builder.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    password: [
      '',
      [
        Validators.required,
        (control: AbstractControl<string>) =>
          !control.value.trim()
            ? { required: true }
            : new TextEncoder().encode(control.value).length > 72
              ? { passwordLength: true }
              : null,
      ],
    ],
  });

  protected fieldError(field: 'email' | 'password'): string | null {
    const control = this.form.controls[field];
    if (!control.touched) return null;
    if (control.hasError('required'))
      return field === 'email' ? 'Informe seu e-mail.' : 'Informe sua senha.';
    if (control.hasError('email')) return 'Informe um e-mail válido.';
    if (control.hasError('maxlength')) return 'O e-mail deve ter até 254 caracteres.';
    if (control.hasError('passwordLength')) return 'A senha deve ter até 72 bytes UTF-8.';
    return this.failure()?.fields?.[field] ?? null;
  }

  protected submit(): void {
    if (
      this.auth.pending() ||
      this.auth.state().status === 'unavailable' ||
      this.auth.state().status === 'checking'
    )
      return;
    this.failure.set(null);
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const request = this.form.getRawValue();
    this.auth
      .login({ ...request, email: request.email.trim().toLowerCase() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.form.controls.password.reset();
          void this.router.navigateByUrl('/dashboard', { replaceUrl: true });
        },
        error: (failure: AuthFailure) => {
          this.form.controls.password.reset();
          this.failure.set(failure);
        },
      });
  }

  protected retrySession(): void {
    this.auth
      .recoverSession()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((state) => {
        if (state.status === 'authenticated')
          void this.router.navigateByUrl('/dashboard', { replaceUrl: true });
      });
  }
}
