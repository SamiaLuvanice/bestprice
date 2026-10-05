export interface LoginRequest {
  readonly email: string;
  readonly password: string;
}
export interface UserResponse {
  readonly email: string;
}
export type AuthState =
  | { readonly status: 'unknown' | 'checking' | 'unavailable'; readonly message?: string }
  | { readonly status: 'anonymous'; readonly message?: string }
  | { readonly status: 'authenticated'; readonly user: UserResponse };
export interface AuthFailure {
  readonly kind: 'credentials' | 'validation' | 'csrf' | 'unavailable' | 'busy';
  readonly message: string;
  readonly fields?: Readonly<Record<string, string>>;
}
