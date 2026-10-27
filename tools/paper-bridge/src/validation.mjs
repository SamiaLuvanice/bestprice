export function compareProperties(actual, expected) {
  const checks = Object.entries(expected).map(([property, value]) => {
    const observed = actual[property];
    const matches = observed !== undefined && (typeof value === "number"
      ? /^-?\d+(?:\.\d+)?(?:px|%)?$/.test(String(observed)) && Math.abs(Number.parseFloat(observed) - value) < 0.01
      : String(observed).replace(/^#/, "").toLowerCase() === String(value).replace(/^#/, "").toLowerCase());
    return { property, expected: value, observed, matches };
  });
  return { verified: checks.length > 0 && checks.every(check => check.matches), checks };
}
