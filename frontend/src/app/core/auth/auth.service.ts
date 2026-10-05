import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import {
  Observable,
  catchError,
  defer,
  finalize,
  map,
  of,
  shareReplay,
  switchMap,
  tap,
  throwError,
  timeout,
} from 'rxjs';
import { AuthFailure, AuthState, LoginRequest, UserResponse } from './auth.model';
import { ApiProblem } from '../http/api-problem.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/auth';
  private readonly currentState = signal<AuthState>({ status: 'unknown' });
  readonly state = this.currentState.asReadonly();
  readonly user = computed(() => {
    const state = this.state();
    return state.status === 'authenticated' ? state.user : null;
  });
  readonly pending = signal(false);
  private generation = 0;
  private checking?: Observable<AuthState>;
  private mutation?: Observable<void>;
  private csrfReady = false;
  private stableState: AuthState = { status: 'unknown' };

  private setState(state: AuthState): void {
    this.currentState.set(state);
    if (state.status !== 'checking') this.stableState = state;
  }

  recoverSession(): Observable<AuthState> {
    if (this.mutation)
      return this.mutation.pipe(
        map(() => this.state()),
        catchError(() => of(this.state())),
      );
    if (this.checking) return this.checking;
    const generation = this.generation;
    const previouslyAuthenticated = this.state().status === 'authenticated';
    this.currentState.set({ status: 'checking' });
    const checking = this.http.get<UserResponse>(`${this.baseUrl}/me`).pipe(
      timeout(10000),
      map((user) => ({ status: 'authenticated', user }) as AuthState),
      catchError((error: unknown) => {
        const problem = this.problem(error);
        return of<AuthState>(
          error instanceof HttpErrorResponse && error.status === 401
            ? {
                status: 'anonymous',
                message:
                  problem.code === 'SESSION_EXPIRED' || previouslyAuthenticated
                    ? 'Sua sessão expirou. Entre novamente'
                    : undefined,
              }
            : {
                status: 'unavailable',
                message: 'Não foi possível recuperar sua sessão. Tente novamente.',
              },
        );
      }),
      map((state) => {
        if (generation === this.generation) this.setState(state);
        return this.state();
      }),
      finalize(() => {
        if (this.checking === checking) this.checking = undefined;
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    this.checking = checking;
    return checking;
  }

  chooseNewLogin(): void {
    if (this.pending()) return;
    ++this.generation;
    this.checking = undefined;
    this.setState({ status: 'anonymous' });
  }

  login(request: LoginRequest): Observable<void> {
    return this.changeSession('login', request);
  }
  logout(): Observable<void> {
    return this.changeSession('logout');
  }

  private changeSession(operation: 'login' | 'logout', request?: LoginRequest): Observable<void> {
    return defer(() => {
      if (this.mutation)
        return throwError((): AuthFailure => ({
          kind: 'busy',
          message: 'Aguarde a solicitação em andamento.',
        }));
      if (operation === 'login' && this.state().status === 'unavailable')
        return throwError((): AuthFailure => ({
          kind: 'unavailable',
          message: 'Recupere sua sessão ou escolha entrar novamente.',
        }));
      const snapshot = this.stableState;
      const generation = ++this.generation;
      this.checking = undefined;
      this.pending.set(true);
      const mutation = this.bootstrapCsrf().pipe(
        switchMap(() =>
          operation === 'login'
            ? this.http
                .post<UserResponse>(`${this.baseUrl}/login`, request)
                .pipe(tap((user) => this.setState({ status: 'authenticated', user })))
            : this.http
                .post<void>(`${this.baseUrl}/logout`, null)
                .pipe(tap(() => this.setState({ status: 'anonymous' }))),
        ),
        timeout(10000),
        map(() => undefined),
        catchError((error: unknown) => {
          if (
            operation === 'logout' &&
            error instanceof HttpErrorResponse &&
            error.status === 401
          ) {
            this.setState({ status: 'anonymous' });
            return of(undefined);
          }
          if (generation === this.generation) this.setState(snapshot);
          if (error instanceof HttpErrorResponse && error.status === 403) {
            this.csrfReady = false;
            this.bootstrapCsrf().subscribe({ error: () => undefined });
          }
          return throwError(() => this.failure(error, operation));
        }),
        tap(() => {
          this.csrfReady = false;
          this.bootstrapCsrf().subscribe({ error: () => undefined });
        }),
        finalize(() => {
          this.pending.set(false);
          this.mutation = undefined;
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
      this.mutation = mutation;
      return mutation;
    });
  }

  private bootstrapCsrf(): Observable<void> {
    if (this.csrfReady) return of(undefined);
    return this.http.get<void>(`${this.baseUrl}/csrf`).pipe(
      timeout(10000),
      tap(() => {
        this.csrfReady = true;
      }),
    );
  }

  private problem(error: unknown): ApiProblem {
    const body: unknown = error instanceof HttpErrorResponse ? error.error : undefined;
    if (!body || typeof body !== 'object') return {};
    const candidate = body as Record<string, unknown>;
    const errors = Array.isArray(candidate['errors'])
      ? candidate['errors'].filter(
          (field): field is { field: string; message: string } =>
            typeof field === 'object' &&
            field !== null &&
            typeof field.field === 'string' &&
            typeof field.message === 'string',
        )
      : undefined;
    return {
      code: typeof candidate['code'] === 'string' ? candidate['code'] : undefined,
      detail: typeof candidate['detail'] === 'string' ? candidate['detail'] : undefined,
      errors,
    };
  }

  private failure(error: unknown, operation: 'login' | 'logout'): AuthFailure {
    const problem = this.problem(error);
    if (error instanceof HttpErrorResponse) {
      if (error.status === 401 && operation === 'login')
        return { kind: 'credentials', message: 'E-mail ou senha inválidos' };
      if (error.status === 400)
        return {
          kind: 'validation',
          message: 'Confira os campos informados.',
          fields: Object.fromEntries(
            problem.errors?.map((field) => [field.field, field.message]) ?? [],
          ),
        };
      if (error.status === 403)
        return {
          kind: 'csrf',
          message: problem.detail ?? 'Não foi possível validar a solicitação. Tente novamente.',
        };
    }
    return {
      kind: 'unavailable',
      message:
        operation === 'login'
          ? 'Não foi possível entrar. Tente novamente'
          : 'Não foi possível confirmar o encerramento. Tente novamente.',
    };
  }
}
