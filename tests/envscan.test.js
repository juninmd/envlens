const { test } = require("node:test");
const assert = require("node:assert/strict");
const { parseEnvKeys, findEnvRefs, missingRefs } = require("../src/envscan.js");

test("parseEnvKeys extracts keys, ignores comments/blank/export", () => {
  const keys = parseEnvKeys("# c\nexport API_KEY=1\nPORT=3000\n\nBAD LINE\n=nokey");
  assert.deepEqual([...keys].sort(), ["API_KEY", "PORT"]);
});

test("findEnvRefs catches the three access styles", () => {
  const code = `
    const a = process.env.FOO;
    const b = process.env['BAR'];
    const c = import.meta.env.BAZ;
  `;
  assert.deepEqual(findEnvRefs(code).map((r) => r.name).sort(), ["BAR", "BAZ", "FOO"]);
});

test("findEnvRefs returns usable index/length", () => {
  const code = "x = process.env.FOO";
  const [ref] = findEnvRefs(code);
  assert.equal(code.slice(ref.index, ref.index + ref.length), "process.env.FOO");
});

test("missingRefs flags only undefined names", () => {
  const refs = findEnvRefs("process.env.FOO; process.env.BAR");
  const defined = new Set(["FOO"]);
  const missing = missingRefs(refs, defined);
  assert.deepEqual(missing.map((r) => r.name), ["BAR"]);
});

test("missingRefs ignores runtime + vite builtins", () => {
  const refs = findEnvRefs("process.env.NODE_ENV; import.meta.env.PROD; process.env.MISSING");
  assert.deepEqual(missingRefs(refs, new Set()).map((r) => r.name), ["MISSING"]);
});

test("parseEnvKeys skips lines inside multiline quoted values", () => {
  const keys = parseEnvKeys('CERT="-----BEGIN FAKE-----\nINNER=1\n-----END FAKE-----"\nREAL=2');
  assert.deepEqual([...keys].sort(), ["CERT", "REAL"]);
});

test("parseEnvKeys handles single-quoted multiline and closed quotes on one line", () => {
  const keys = parseEnvKeys("A='x\nB=1'\nC=\"ok\"\nD='it''s'\nE=2");
  assert.deepEqual([...keys].sort(), ["A", "C", "D", "E"]);
});

test("parseEnvKeys accepts export followed by tab or several spaces", () => {
  assert.deepEqual([...parseEnvKeys("export\tFOO=1\nexport   BAR=2")].sort(), ["BAR", "FOO"]);
});

test("parseEnvKeys handles CRLF, BOM, spaces around = and inline comments", () => {
  const keys = parseEnvKeys("﻿A=1\r\nB = 2\r\nC=3 # note\r\n");
  assert.deepEqual([...keys].sort(), ["A", "B", "C"]);
});

test("parseEnvKeys ignores dotted keys, bare '=' and non-string input", () => {
  assert.deepEqual([...parseEnvKeys("A.B=1\n=\nOK=1")], ["OK"]);
  assert.equal(parseEnvKeys("").size, 0);
  assert.equal(parseEnvKeys(undefined).size, 0);
});
