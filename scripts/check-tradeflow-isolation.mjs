#!/usr/bin/env node
// TransformerFlow / TradeFlow isolation guard.
//
// TransformerFlow and TradeFlow are sister products under Insignia Tech. TransformerFlow's
// foundational schema was originally ported from TradeFlow (an authorized, one-time,
// foundation-building decision — see docs-architecture/00-overview.md). That reuse is done;
// from this point forward TransformerFlow must not accumulate NEW references to TradeFlow's
// repository, database, environment, or terminology. This script fails the build when one
// is introduced.
//
// This is intentionally more than a single grep: it (1) scans for the literal "tradeflow"
// string in live code/migrations, (2) parses actual SQL identifiers (table names, permission
// keys, module codes) out of the migrations rather than trusting prose, and checks those
// against forbidden business terms, and (3) looks for cross-repo import/path patterns that a
// plain keyword scan could miss if someone aliased the string.
//
// Historical planning docs in docs-architecture/ are exempt by design — they document the
// original, approved porting decision and are meant to keep saying "Tradeflow". Everything
// else (frontend/src, database/migrations, supabase/functions) is live product surface and
// must stay clean.

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = join(fileURLToPath(new URL('.', import.meta.url)), '..')

const SCAN_DIRS = ['frontend/src', 'database/migrations', 'supabase/functions']
const SKIP_DIR_NAMES = new Set(['node_modules', 'dist', 'dist-web', '_ldb_copy', '.git'])
const SCAN_EXTENSIONS = new Set(['.ts', '.tsx', '.sql', '.js', '.mjs'])

// Specific, exact lines that are deliberate, approved historical/independence notes — not a
// live dependency. Each entry must match the file AND a substring of the exact line, so a
// change to the surrounding text still gets caught if it drifts into something new.
const ALLOWLIST = [
  {
    file: 'database/migrations/20260801090000_workshop_schema.sql',
    contains: 'no Tradeflow',
  },
]

const FORBIDDEN_TEXT_PATTERNS = [/tradeflow/i]

const FORBIDDEN_BUSINESS_TERMS = ['hardware', 'kitchen', 'modular kitchen', 'hardware-sales', 'hardware_sales']

const FORBIDDEN_ENV_KEY_PATTERN = /TRADEFLOW/i

/** @type {{file: string, line: number, rule: string, text: string}[]} */
const violations = []

function isAllowlisted(relPath, lineText) {
  return ALLOWLIST.some((entry) => entry.file === relPath.replaceAll('\\', '/') && lineText.includes(entry.contains))
}

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIR_NAMES.has(entry)) continue
    const full = join(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) {
      walk(full)
    } else if (SCAN_EXTENSIONS.has(extname(entry))) {
      scanFile(full)
    }
  }
}

function scanFile(absPath) {
  const relPath = relative(repoRoot, absPath)
  const content = readFileSync(absPath, 'utf8')
  const lines = content.split('\n')

  lines.forEach((lineText, idx) => {
    const lineNum = idx + 1

    // Rule 1: forbidden text (case-insensitive "tradeflow" anywhere)
    for (const pattern of FORBIDDEN_TEXT_PATTERNS) {
      if (pattern.test(lineText) && !isAllowlisted(relPath, lineText)) {
        violations.push({ file: relPath, line: lineNum, rule: 'forbidden-text', text: lineText.trim() })
      }
    }

    // Rule 2: cross-repo import/require of a path that isn't inside this repo
    const importMatch = lineText.match(/(?:from|require\()\s*['"]([^'"]+)['"]/)
    if (importMatch) {
      const spec = importMatch[1]
      if (/^[a-zA-Z]:\\|^\/(?!$)/.test(spec) && !spec.startsWith('.') && spec.toLowerCase().includes('tradeflow')) {
        violations.push({ file: relPath, line: lineNum, rule: 'cross-repo-import', text: lineText.trim() })
      }
    }
  })

  // Rule 3: parse actual SQL identifiers out of migrations and check them, rather than
  // trusting prose — catches a forbidden term landing in a real table/column/permission/module
  // name even if no human-readable "tradeflow" text is nearby.
  if (extname(absPath) === '.sql') {
    const identifierPatterns = [
      /create table\s+(?:if not exists\s+)?public\.(\w+)/gi,
      /insert into public\.permissions[\s\S]*?\(\s*'([\w.]+)'/gi,
      /insert into public\.modules[\s\S]*?\(\s*'([\w-]+)'/gi,
    ]
    for (const pattern of identifierPatterns) {
      let match
      while ((match = pattern.exec(content))) {
        const identifier = match[1].toLowerCase()
        for (const term of FORBIDDEN_BUSINESS_TERMS) {
          if (identifier.includes(term.replace(/[\s-]/g, '_')) || identifier.includes(term.replace(/[\s-]/g, ''))) {
            const lineNum = content.slice(0, match.index).split('\n').length
            violations.push({ file: relPath, line: lineNum, rule: 'forbidden-identifier', text: match[1] })
          }
        }
      }
    }
  }
}

function checkEnvFiles() {
  for (const envFile of ['frontend/.env.example']) {
    const abs = join(repoRoot, envFile)
    try {
      const content = readFileSync(abs, 'utf8')
      content.split('\n').forEach((lineText, idx) => {
        const key = lineText.split('=')[0]
        if (key && FORBIDDEN_ENV_KEY_PATTERN.test(key)) {
          violations.push({ file: envFile, line: idx + 1, rule: 'forbidden-env-key', text: lineText.trim() })
        }
      })
    } catch {
      // file doesn't exist — nothing to check
    }
  }
}

for (const dir of SCAN_DIRS) {
  const abs = join(repoRoot, dir)
  try {
    walk(abs)
  } catch {
    // directory doesn't exist in this checkout — skip
  }
}
checkEnvFiles()

if (violations.length > 0) {
  console.error(`\nTradeFlow isolation check FAILED — ${violations.length} violation(s):\n`)
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  [${v.rule}]  ${v.text}`)
  }
  console.error(
    '\nTransformerFlow must not introduce new TradeFlow references outside docs-architecture/ ' +
      '(historical record, exempt by design). If this is a deliberate, approved historical note, ' +
      'add it to the ALLOWLIST in scripts/check-tradeflow-isolation.mjs with justification.\n',
  )
  process.exit(1)
}

console.log('TradeFlow isolation check passed — no forbidden references found.')
