import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { vi } from 'vitest';
import { AuthService } from './auth.service';
import { AuthFailure } from './auth.model';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => {
    http.verify();
    vi.useRealTimers();
  });
  const user = { email: 'tester@example.test' };
  const credentials = { ...user, password: crypto.randomUUID() };
  function csrf(): void {
    const request = http.expectOne('/api/auth/csrf');
    expect(request.request.method).toBe('GET');
    request.flush(null, { status: 204, statusText: 'No Content' });
  }
  function authenticate(): void {
    service.login(credentials).subscribe();
    csrf();
    const request = http.expectOne('/api/auth/login');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(credentials);
    request.flush(user);
    csrf();
  }

  it('bootstraps CSRF before login and preserves login if later token refresh fails', () => {
    service.login(credentials).subscribe();
    http.expectNone('/api/auth/login');
    csrf();
    http.expectOne('/api/auth/login').flush(user);
    http.expectOne('/api/auth/csrf').flush(null, { status: 503, statusText: 'Unavailable' });

    expect(service.user()).toEqual(user);
    expect(service.pending()).toBe(false);
  });
  it('shares session recovery and removes protected identity during checking', () => {
    authenticate();
    service.recoverSession().subscribe();
    service.recoverSession().subscribe();
    expect(service.user()).toBeNull();
    http.expectOne('/api/auth/me').flush(user);

    expect(service.user()).toEqual(user);
  });
  it('does not resurrect a session from a response started before logout', () => {
    authenticate();
    service.recoverSession().subscribe();
    const old = http.expectOne('/api/auth/me');
    service.logout().subscribe();
    http.expectOne('/api/auth/logout').flush(null, { status: 204, statusText: 'No Content' });
    csrf();
    old.flush(user);

    expect(service.state().status).toBe('anonymous');
    expect(service.user()).toBeNull();
  });
  it('restores the last stable session when logout fails during recovery', () => {
    authenticate();
    service.recoverSession().subscribe();
    const old = http.expectOne('/api/auth/me');
    service.logout().subscribe({ error: () => undefined });
    http.expectOne('/api/auth/logout').flush(null, { status: 503, statusText: 'Unavailable' });
    old.flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(service.user()).toEqual(user);
    expect(service.state().status).toBe('authenticated');
  });
  it('does not let an old 401 erase a newer login', () => {
    service.recoverSession().subscribe();
    const old = http.expectOne('/api/auth/me');
    authenticate();
    old.flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(service.user()).toEqual(user);
  });
  it.each([204, 401])('clears logout on confirmed status %s', (status) => {
    authenticate();
    service.logout().subscribe();
    http
      .expectOne('/api/auth/logout')
      .flush(null, { status, statusText: status === 204 ? 'No Content' : 'Unauthorized' });
    csrf();

    expect(service.state().status).toBe('anonymous');
  });
  it('distinguishes credential failure from a network failure and permits another attempt', () => {
    const failures: AuthFailure[] = [];
    service.login(credentials).subscribe({ error: (failure) => failures.push(failure) });
    csrf();
    http
      .expectOne('/api/auth/login')
      .flush({ code: 'INVALID_CREDENTIALS' }, { status: 401, statusText: 'Unauthorized' });
    service.login(credentials).subscribe({ error: (failure) => failures.push(failure) });
    http.expectOne('/api/auth/login').error(new ProgressEvent('error'));

    expect(failures.map((failure) => failure.message)).toEqual([
      'E-mail ou senha inválidos',
      'Não foi possível entrar. Tente novamente',
    ]);
    expect(service.pending()).toBe(false);
  });
  it('maps validation fields and renews CSRF without retrying POST after 403', () => {
    const failures: AuthFailure[] = [];
    service.login(credentials).subscribe({ error: (failure) => failures.push(failure) });
    csrf();
    http
      .expectOne('/api/auth/login')
      .flush(
        { errors: [{ field: 'email', message: 'E-mail inválido.' }] },
        { status: 400, statusText: 'Bad Request' },
      );
    expect(failures[0].fields?.['email']).toBe('E-mail inválido.');
    service.login(credentials).subscribe({ error: (failure) => failures.push(failure) });
    http
      .expectOne('/api/auth/login')
      .flush({ code: 'INVALID_CSRF_TOKEN' }, { status: 403, statusText: 'Forbidden' });
    csrf();

    http.expectNone('/api/auth/login');
    expect(failures[1].kind).toBe('csrf');
  });
  it('blocks duplicate mutation requests', () => {
    service.login(credentials).subscribe();
    service.login(credentials).subscribe({ error: () => undefined });
    csrf();
    http.expectOne('/api/auth/login').flush(user);
    csrf();

    expect(service.user()).toEqual(user);
  });
  it('times out session recovery without calling it expiry', async () => {
    vi.useFakeTimers();
    service.recoverSession().subscribe();
    const request = http.expectOne('/api/auth/me');
    await vi.advanceTimersByTimeAsync(10001);

    expect(request.cancelled).toBe(true);
    expect(service.state().status).toBe('unavailable');
  });
  it('reports expired sessions and permits deliberate new login after unavailable recovery', () => {
    service.recoverSession().subscribe();
    http
      .expectOne('/api/auth/me')
      .flush({ code: 'SESSION_EXPIRED' }, { status: 401, statusText: 'Unauthorized' });
    expect(service.state()).toEqual({
      status: 'anonymous',
      message: 'Sua sessão expirou. Entre novamente',
    });
    service.recoverSession().subscribe();
    http.expectOne('/api/auth/me').error(new ProgressEvent('error'));
    service.login(credentials).subscribe({ error: () => undefined });
    http.expectNone('/api/auth/csrf');
    service.chooseNewLogin();
    authenticate();

    expect(service.user()).toEqual(user);
  });
});
