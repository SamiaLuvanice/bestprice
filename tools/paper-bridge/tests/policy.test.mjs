import test from "node:test";
import assert from "node:assert/strict";
import { validateEndpoint, validateDocument } from "../src/policy.mjs";

test("CDP aceita apenas a origem HTTP local sem credenciais ou caminhos", () => {
  assert.equal(validateEndpoint("http://127.0.0.1:9222"), "http://127.0.0.1:9222");
  for (const value of ["https://example.com", "http://0.0.0.0:9222", "http://127.0.0.1.evil:9222", "http://user:pass@127.0.0.1:9222", "http://127.0.0.1:9222/private", "http://127.0.0.1:9222/?token=secret"]) {
    assert.throws(() => validateEndpoint(value), /CDP local/);
  }
});
test("somente o documento explicitamente autorizado pode ser operado", () => {
  assert.equal(validateDocument("BestPrice Bridge Test"), "BestPrice Bridge Test");
  assert.throws(() => validateDocument("BestPriceIA"), /autorizado/);
  assert.throws(() => validateDocument("BestPrice Bridge Test backup"), /autorizado/);
});
