import { test, expect } from "bun:test";
import { parseEnvKeys, findEnvRefs, missingRefs } from "../src/envscan.js";

test("parseEnvKeys extracts keys, ignores comments/blank/export", () => {
  const keys = parseEnvKeys("# c\nexport API_KEY=1\nPORT=3000\n\nBAD LINE\n=nokey");
  expect([...keys].sort()).toEqual(["API_KEY", "PORT"]);
});

test("findEnvRefs catches the three access styles", () => {
  const code = `
    const a = process.env.FOO;
    const b = process.env['BAR'];
    const c = import.meta.env.BAZ;
  `;
  expect(findEnvRefs(code).map((r) => r.name).sort()).toEqual(["BAR", "BAZ", "FOO"]);
});

test("findEnvRefs returns usable index/length", () => {
  const code = "x = process.env.FOO";
  const [ref] = findEnvRefs(code);
  expect(code.slice(ref.index, ref.index + ref.length)).toBe("process.env.FOO");
});

test("missingRefs flags only undefined names", () => {
  const refs = findEnvRefs("process.env.FOO; process.env.BAR");
  const defined = new Set(["FOO"]);
  const missing = missingRefs(refs, defined);
  expect(missing.map((r) => r.name)).toEqual(["BAR"]);
});

test("missingRefs ignores runtime + vite builtins", () => {
  const refs = findEnvRefs("process.env.NODE_ENV; import.meta.env.PROD; process.env.MISSING");
  expect(missingRefs(refs, new Set()).map((r) => r.name)).toEqual(["MISSING"]);
});
