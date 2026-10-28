import test from "node:test";
import assert from "node:assert/strict";
import { loadDesignSystem } from "../src/design-system.mjs";
test("adaptador lê a identidade real e distingue primária de ação", async () => {
  const ds = await loadDesignSystem();
  assert.equal(ds.colors.background, "#ffffff");
  assert.equal(ds.colors.primary, "#c7005e");
  assert.equal(ds.colors.action, "#39ff14");
  assert.equal(ds.spacing["space-16"], "64px");
  assert.equal(ds.radius["radius-control"], "12px");
  assert.ok(ds.routes.includes("/app/dashboard"));
  assert.ok(ds.typography.display.includes("SF Pro Display"));
});
