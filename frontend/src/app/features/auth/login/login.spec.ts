import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { Login } from './login';
import { AuthService } from '../../../core/auth/auth.service';

describe('Login', () => {
  let fixture: ComponentFixture<Login>;
  let http: HttpTestingController;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'dashboard', component: Login }]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    http = TestBed.inject(HttpTestingController);
    TestBed.inject(AuthService).chooseNewLogin();
    await fixture.whenStable();
    element = fixture.nativeElement as HTMLElement;
  });
  afterEach(() => http.verify());
  function fill(email = 'tester@example.test'): void {
    for (const [type, value] of [
      ['email', email],
      ['password', crypto.randomUUID()],
    ]) {
      const input = element.querySelector<HTMLInputElement>(`input[type=${type}]`)!;
      input.value = value;
      input.dispatchEvent(new Event('input'));
    }
  }
  function submit(): void {
    element
      .querySelector('form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  }

  it('shows accessible validation without sending HTTP', async () => {
    submit();
    await fixture.whenStable();

    expect(element.querySelectorAll('[aria-invalid=true]').length).toBe(2);
    expect(element.textContent).toContain('Informe seu e-mail.');
    expect(element.querySelector('label[for=email]')).not.toBeNull();
    http.expectNone('/api/auth/login');
    http.expectNone('/api/auth/csrf');
  });
  it('blocks malformed email and overly long UTF8 password', async () => {
    fill('invalid');
    const password = element.querySelector<HTMLInputElement>('input[type=password]')!;
    password.value = 'é'.repeat(37);
    password.dispatchEvent(new Event('input'));
    submit();
    await fixture.whenStable();

    expect(element.textContent).toContain('Informe um e-mail válido.');
    expect(element.textContent).toContain('72 bytes');
    http.expectNone('/api/auth/csrf');
  });
  it.each([401, 503])('shows failure for status %s and permits retry', async (status) => {
    fill();
    submit();
    submit();
    http.expectOne('/api/auth/csrf').flush(null);
    const request = http.expectOne('/api/auth/login');
    request.flush(null, { status, statusText: 'Failure' });
    await fixture.whenStable();

    expect(element.querySelector('[role=alert]')?.textContent).toBe(
      status === 401 ? 'E-mail ou senha inválidos' : 'Não foi possível entrar. Tente novamente',
    );
    expect(element.querySelector<HTMLButtonElement>('button[type=submit]')?.disabled).toBe(false);
    fill();
    submit();
    http.expectOne('/api/auth/login').flush(null, { status: 401, statusText: 'Unauthorized' });
  });
  it('navigates after valid login and clears the password', async () => {
    fill();
    submit();
    http.expectOne('/api/auth/csrf').flush(null);
    http.expectOne('/api/auth/login').flush({ email: 'tester@example.test' });
    http.expectOne('/api/auth/csrf').flush(null);
    await fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/dashboard');
    expect(element.querySelector<HTMLInputElement>('input[type=password]')?.value).toBe('');
  });
});
