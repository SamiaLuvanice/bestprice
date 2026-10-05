import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { Dashboard } from './dashboard';
import { AuthService } from '../../core/auth/auth.service';

describe('Dashboard', () => {
  let fixture: ComponentFixture<Dashboard>;
  let http: HttpTestingController;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'login', component: Dashboard }]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    http = TestBed.inject(HttpTestingController);
    TestBed.inject(AuthService).recoverSession().subscribe();
    http.expectOne('/api/auth/me').flush({ email: 'tester@example.test' });
    await fixture.whenStable();
    element = fixture.nativeElement as HTMLElement;
  });
  afterEach(() => http.verify());

  it('shows confirmation and email without banking data', () => {
    expect(element.textContent).toContain('Acesso confirmado');
    expect(element.textContent).toContain('tester@example.test');
    expect(element.querySelector('button')?.textContent).toContain('Sair');
  });
  it.each([204, 401])('returns to login after logout status %s', async (status) => {
    element.querySelector('button')!.click();
    http.expectOne('/api/auth/csrf').flush(null);
    http
      .expectOne('/api/auth/logout')
      .flush(null, { status, statusText: status === 204 ? 'No Content' : 'Unauthorized' });
    http.expectOne('/api/auth/csrf').flush(null);
    await fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/login');
    expect(TestBed.inject(AuthService).user()).toBeNull();
  });
  it('keeps identification and retry after failed logout', async () => {
    element.querySelector('button')!.click();
    http.expectOne('/api/auth/csrf').flush(null);
    http.expectOne('/api/auth/logout').error(new ProgressEvent('error'));
    await fixture.whenStable();

    expect(element.querySelector('[role=alert]')?.textContent).toContain(
      'Não foi possível confirmar',
    );
    expect(element.textContent).toContain('tester@example.test');
    expect(element.querySelector<HTMLButtonElement>('button')?.disabled).toBe(false);
  });
  it('renews csrf after rejection without repeating logout automatically', async () => {
    element.querySelector('button')!.click();
    http.expectOne('/api/auth/csrf').flush(null);
    http
      .expectOne('/api/auth/logout')
      .flush({ code: 'INVALID_CSRF_TOKEN' }, { status: 403, statusText: 'Forbidden' });
    http.expectOne('/api/auth/csrf').flush(null);
    await fixture.whenStable();

    http.expectNone('/api/auth/logout');
    expect(element.querySelector('[role=alert]')).not.toBeNull();
  });
  it('revalidates a restored page and hides identity until the server answers', async () => {
    window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
    await fixture.whenStable();
    expect(element.textContent).not.toContain('tester@example.test');
    http
      .expectOne('/api/auth/me')
      .flush({ code: 'SESSION_EXPIRED' }, { status: 401, statusText: 'Unauthorized' });
    await fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/login');
  });
});
