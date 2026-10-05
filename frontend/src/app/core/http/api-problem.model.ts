export interface ApiProblem {
  readonly code?: string;
  readonly detail?: string;
  readonly errors?: readonly { readonly field: string; readonly message: string }[];
}
