import test from "node:test";
import assert from "node:assert/strict";
import { compareProperties } from "../src/validation.mjs";
import { documentToCss } from "../src/canvas.mjs";
test("verificação exige evidência e rejeita valores parcialmente numéricos", () => {
  assert.equal(compareProperties({}, {}).verified, false);
  assert.equal(compareProperties({}, { Width: 1440 }).verified, false);
  assert.equal(compareProperties({ Width: "1440oops" }, { Width: 1440 }).verified, false);
  assert.equal(compareProperties({ Width: "1440", Fill: "C7005E" }, { Width: 1440, Fill: "#c7005e" }).verified, true);
});
test("coordenadas incluem pan e zoom CSS; DPR não entra na transformação", () => {
  const point = documentToCss({ x: 330, y: 114, width: 876, height: 547.5 }, { width: 1440, height: 900 }, { x: 80, y: 64 });
  assert.ok(Math.abs(point.x - 378.6666667) < 0.0001);
  assert.ok(Math.abs(point.y - 152.9333333) < 0.0001);
  assert.throws(() => documentToCss({ x: 0, y: 0, width: 0, height: 0 }, { width: 1440, height: 900 }, { x: 80, y: 64 }), /Transformação/);
  assert.throws(() => documentToCss({ x: 0, y: 0, width: 1440, height: 900 }, { width: 1440, height: 900 }, { x: NaN, y: 64 }), /Transformação/);
});
