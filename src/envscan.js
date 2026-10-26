// Pure env-reference scanning — no vscode dependency, unit-testable.

const DEFAULT_KNOWN = ["NODE_ENV", "PATH", "HOME", "PWD", "CI"];

/** Extract defined keys from a .env file's text. Never retain values. */
function parseEnvKeys(text) {
  const keys = new Set();
  const lines = String(text).split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith("#")) continue;
    const body = line.replace(/^export\s+/, "");
    const eq = body.indexOf("=");
    if (eq < 1) continue;
    const key = body.slice(0, eq).trim();
    if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) keys.add(key);
    const value = body.slice(eq + 1).trim();
    const quote = value[0];
    // An unclosed quote opens a multiline value: skip lines until it closes.
    if ((quote === '"' || quote === "'") && !value.includes(quote, 1)) {
      while (++i < lines.length && !lines[i].includes(quote));
    }
  }
  return keys;
}

const PATTERNS = [
  /process\.env\.([A-Za-z_][A-Za-z0-9_]*)/g,
  /process\.env\[\s*['"]([A-Za-z_][A-Za-z0-9_]*)['"]\s*\]/g,
  /import\.meta\.env\.([A-Za-z_][A-Za-z0-9_]*)/g,
];

/** Find every env reference in code. Returns { name, index, length }. */
function findEnvRefs(code) {
  const refs = [];
  for (const re of PATTERNS) {
    re.lastIndex = 0;
    for (let m = re.exec(code); m; m = re.exec(code)) {
      refs.push({ name: m[1], index: m.index, length: m[0].length });
    }
  }
  return refs.sort((a, b) => a.index - b.index);
}

/**
 * Refs whose name is neither defined nor known-at-runtime.
 * Vite's `import.meta.env` built-ins (MODE, DEV, PROD, SSR, BASE_URL) are ignored.
 */
function missingRefs(refs, defined, known = DEFAULT_KNOWN) {
  const viteBuiltins = new Set(["MODE", "DEV", "PROD", "SSR", "BASE_URL"]);
  const ok = new Set([...defined, ...known]);
  return refs.filter((r) => !ok.has(r.name) && !viteBuiltins.has(r.name));
}

module.exports = { parseEnvKeys, findEnvRefs, missingRefs, DEFAULT_KNOWN };
