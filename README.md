# 🌱 envlens

A **VS Code extension** that underlines `process.env.X` / `process.env['X']` / `import.meta.env.X` references that **aren't defined in any `.env` file** in your workspace — as squiggly warnings in the Problems panel.

Catches the classic "works on my machine": a config key you read in code but forgot to add to `.env` / `.env.example`. The homelab-scale sibling of the **envdiff** CLI.

## Behavior
- Scans JS/TS/JSX/TSX on open, save, and editor switch.
- Defined keys are collected from all `**/.env*` files (excluding `node_modules`).
- Runtime built-ins (`NODE_ENV`, `PATH`, …) and Vite's `import.meta.env` built-ins (`MODE`, `DEV`, `PROD`, `SSR`, `BASE_URL`) are never flagged.

## Layout
- `src/envscan.js` — pure `parseEnvKeys` + `findEnvRefs` + `missingRefs` (tested core).
- `extension.js` — DiagnosticCollection wiring.

## Dev
```bash
bun test
# F5 for the Extension Development Host, or: npx @vscode/vsce package
```

MIT.
