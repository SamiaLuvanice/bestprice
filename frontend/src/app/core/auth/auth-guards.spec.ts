import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../app.routes';
import { AuthService } from './auth.service';

describe('Authentication navigation', () => {
  let http: HttpTestingController;
  let harness: RouterTestingHarness;
  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter(routes)],
    });
    http = TestBed.inject(HttpTestingController);
    harness = await RouterTestingHarness.create();
  });
  afterEach(() => http.verify());
  async function pendingMe(): Promise<void> {
    for (let attempt = 0; attempt < 30; ++attempt) {
      await new Promise((resolve) => setTimeout(resolve, 0));
      if (TestBed.inject(AuthService).state().status === 'checking') return;
    }
    throw new Error('A navegação não consultou a sessão.');
  }
  it.each(['/', '/dashboard', '/unknown'])(
    'protects %s and redirects to login without loops',
    async (url) => {
      const navigation = harness.navigateByUrl(url);
      await pendingMe();
      http.expectOne('/api/auth/me').flush(null, { status: 401, statusText: 'Unauthorized' });
      await navigation;

      expect(TestBed.inject(Router).url).toBe('/login');
      expect(harness.routeNativeElement?.textContent).toContain('Entre na sua conta');
    },
  );
  it('recovers the session before displaying dashboard after reload', async () => {
    const navigation = harness.navigateByUrl('/dashboard');
    await pendingMe();
    expect(harness.routeNativeElement?.textContent ?? '').not.toContain('tester@example.test');
    http.expectOne('/api/auth/me').flush({ email: 'tester@example.test' });
    await navigation;

    expect(harness.routeNativeElement?.textContent).toContain('tester@example.test');
  });
  it('redirects an authenticated login route to the dashboard', async () => {
    const navigation = harness.navigateByUrl('/login');
    await pendingMe();
    http.expectOne('/api/auth/me').flush({ email: 'tester@example.test' });
    await new Promise((resolve) => setTimeout(resolve, 0));
    http.expectOne('/api/auth/me').flush({ email: 'tester@example.test' });
    await navigation;

    expect(TestBed.inject(Router).url).toBe('/dashboard');
  });
  it('offers recovery after unavailable API without redirect loops or expired message', async () => {
    const navigation = harness.navigateByUrl('/dashboard');
    await pendingMe();
    http.expectOne('/api/auth/me').flush(null, { status: 503, statusText: 'Unavailable' });
    await navigation;

    expect(TestBed.inject(Router).url).toBe('/login');
    expect(harness.routeNativeElement?.textContent).toContain('Tentar recuperar sessão');
    expect(harness.routeNativeElement?.textContent).not.toContain('Sua sessão expirou');
  });
});
