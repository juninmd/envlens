const vscode = require("vscode");
const { parseEnvKeys, findEnvRefs, missingRefs } = require("./src/envscan");

const LANGS = new Set(["javascript", "typescript", "javascriptreact", "typescriptreact"]);
let diagnostics;

async function definedKeys() {
  const keys = new Set();
  const files = await vscode.workspace.findFiles("**/.env*", "**/node_modules/**", 20);
  for (const uri of files) {
    try {
      const bytes = await vscode.workspace.fs.readFile(uri);
      for (const k of parseEnvKeys(Buffer.from(bytes).toString("utf8"))) keys.add(k);
    } catch {
      /* ignore unreadable */
    }
  }
  return keys;
}

async function lint(doc) {
  if (!doc || !LANGS.has(doc.languageId)) return;
  const defined = await definedKeys();
  const missing = missingRefs(findEnvRefs(doc.getText()), defined);
  const diags = missing.map((r) => {
    const range = new vscode.Range(doc.positionAt(r.index), doc.positionAt(r.index + r.length));
    const d = new vscode.Diagnostic(
      range,
      `envlens: "${r.name}" não está em nenhum .env do workspace`,
      vscode.DiagnosticSeverity.Warning,
    );
    d.source = "envlens";
    return d;
  });
  diagnostics.set(doc.uri, diags);
}

function activate(context) {
  diagnostics = vscode.languages.createDiagnosticCollection("envlens");
  context.subscriptions.push(
    diagnostics,
    vscode.workspace.onDidOpenTextDocument(lint),
    vscode.workspace.onDidSaveTextDocument(lint),
    vscode.window.onDidChangeActiveTextEditor((e) => e && lint(e.document)),
    vscode.commands.registerCommand("envlens.scan", () => {
      const ed = vscode.window.activeTextEditor;
      if (ed) lint(ed.document);
    }),
  );
  if (vscode.window.activeTextEditor) lint(vscode.window.activeTextEditor.document);
}

function deactivate() {}

module.exports = { activate, deactivate };
