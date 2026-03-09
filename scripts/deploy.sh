#!/usr/bin/env bash
# scripts/deploy.sh — Build and publish bessa_patterns.ts to npm
# Invoked by: ai-workflow deploy
# Guards: NPM_TOKEN must be set, tests must pass, build must succeed

set -euo pipefail

# ── Colour helpers ────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; NC='\033[0m'
info()  { echo -e "${CYAN}[deploy]${NC} $*"; }
ok()    { echo -e "${GREEN}[deploy] ✓${NC} $*"; }
fail()  { echo -e "${RED}[deploy] ✗${NC} $*" >&2; exit 1; }

# ── Guards ────────────────────────────────────────────────────────────────────
[[ -z "${NPM_TOKEN:-}" ]] && fail "NPM_TOKEN is not set. Export it before running deploy."

command -v npm >/dev/null 2>&1 || fail "npm not found on PATH."

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

info "Project root: $PROJECT_ROOT"

# ── Install dependencies ──────────────────────────────────────────────────────
info "Installing dependencies..."
npm ci --prefer-offline --no-audit
ok "Dependencies installed"

# ── Test ─────────────────────────────────────────────────────────────────────
info "Running tests..."
npm test || fail "Tests failed. Aborting deploy."
ok "Tests passed"

# ── Build ─────────────────────────────────────────────────────────────────────
info "Building TypeScript..."
npm run build || fail "Build failed. Aborting deploy."
ok "Build complete"

# ── Publish ───────────────────────────────────────────────────────────────────
info "Publishing to npm..."
echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > "$PROJECT_ROOT/.npmrc"

npm publish --access public 2>&1 || {
  rm -f "$PROJECT_ROOT/.npmrc"
  fail "npm publish failed."
}

rm -f "$PROJECT_ROOT/.npmrc"
ok "Published successfully"
