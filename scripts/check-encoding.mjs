import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const ROOT = process.cwd();

const INCLUDED_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".html",
  ".css",
  ".scss",
  ".md",
  ".sql",
  ".yml",
  ".yaml",
  ".env",
  ".txt"
]);

const EXCLUDED_DIRS = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  "coverage",
  ".next",
  ".local-dev"
]);

const suspiciousPatterns = [
  /Ã§/g,
  /Ã£/g,
  /Ã¡/g,
  /Ã©/g,
  /Ãª/g,
  /Ã³/g,
  /Ã­/g,
  /Ãº/g,
  /Ã€/g,
  /Ã‰/g,
  /Ã“/g,
  /Ã‡/g,
  /Â /g,
  /Âº/g,
  /â€™/g,
  /â€œ/g,
  /â€/g,
  /ï¿½/g,
  /\uFFFD/g
];

const utf8Decoder = new TextDecoder("utf-8", { fatal: true });

function listFiles(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!EXCLUDED_DIRS.has(entry.name)) {
        files.push(...listFiles(fullPath));
      }
      continue;
    }

    const ext = extname(entry.name).toLowerCase();
    if (INCLUDED_EXTENSIONS.has(ext) || entry.name === ".env.example") {
      files.push(fullPath);
    }
  }

  return files;
}

function lineAndColumnFromIndex(content, index) {
  let line = 1;
  let column = 1;
  for (let i = 0; i < index; i += 1) {
    if (content.charCodeAt(i) === 10) {
      line += 1;
      column = 1;
    } else {
      column += 1;
    }
  }
  return { line, column };
}

const allFiles = listFiles(ROOT);
const errors = [];

for (const filePath of allFiles) {
  const normalizedPath = filePath.replace(/\\/g, "/");
  if (normalizedPath.endsWith("/scripts/check-encoding.mjs")) {
    continue;
  }

  const stats = statSync(filePath);
  if (stats.size === 0) continue;

  const bytes = readFileSync(filePath);

  let content = "";
  try {
    content = utf8Decoder.decode(bytes);
  } catch {
    errors.push({
      file: filePath,
      reason: "Arquivo não está em UTF-8 válido."
    });
    continue;
  }

  for (const pattern of suspiciousPatterns) {
    pattern.lastIndex = 0;
    const match = pattern.exec(content);
    if (!match) continue;

    const { line, column } = lineAndColumnFromIndex(content, match.index);
    errors.push({
      file: filePath,
      reason: `Texto suspeito de mojibake: "${match[0]}"`,
      line,
      column
    });
  }
}

if (errors.length > 0) {
  console.error("\n[check-encoding] Falha: foram encontrados problemas de encoding/mojibake.\n");
  for (const error of errors) {
    const relative = error.file.replace(`${ROOT}\\`, "").replace(`${ROOT}/`, "");
    if (error.line && error.column) {
      console.error(`- ${relative}:${error.line}:${error.column} -> ${error.reason}`);
    } else {
      console.error(`- ${relative} -> ${error.reason}`);
    }
  }
  console.error("\nCorrija os arquivos acima antes de gerar build.\n");
  process.exit(1);
}

console.log("[check-encoding] OK: arquivos em UTF-8 e sem padrões de mojibake.");
