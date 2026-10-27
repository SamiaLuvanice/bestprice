export const TEST_DOCUMENT = "BestPrice Bridge Test";
export function validateEndpoint(value) {
  if (!/^http:\/\/127\.0\.0\.1:\d{1,5}\/?$/.test(value)) {
    throw new Error("CDP local exige http://127.0.0.1:PORTA, sem caminho ou credenciais.");
  }
  return new URL(value).origin;
}
export function validateDocument(value) {
  if (value !== TEST_DOCUMENT) throw new Error("Documento não autorizado. Use BestPrice Bridge Test.");
  return value;
}
