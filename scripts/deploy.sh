#!/usr/bin/env bash
# scripts/deploy.sh — Build and publish bessa_patterns.ts to npm
# Invoked by: ai-workflow deploy
# Guards: NPM_TOKEN must be set, tests must pass, build must succeed

set -euo pipefail

# ── Cleanup ───────────────────────────────────────────────────────────────────
cleanup() {
  rm -f "${PROJECT_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}/.npmrc"
}
trap cleanup EXIT

# ── Colour helpers ────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; NC='\033[0m'
info()  { echo -e "${CYAN}[deploy]${NC} $*"; }
ok()    { echo -e "${GREEN}[deploy] ✓${NC} $*"; }
fail()  { echo -e "${RED}[deploy] ✗${NC} $*" >&2; exit 1; }

# ── Guards ────────────────────────────────────────────────────────────────────
if [[ -z "${NPM_TOKEN:-}" ]]; then
  echo -e "${RED}[deploy] ✗${NC} NPM_TOKEN is not set." >&2
  echo -e "${CYAN}[deploy]${NC} To fix this, create an Automation token on npm:" >&2
  echo -e "${CYAN}[deploy]${NC}   1. Go to https://www.npmjs.com/settings/~/tokens" >&2
  echo -e "${CYAN}[deploy]${NC}   2. Generate New Token → Granular Access Token" >&2
  echo -e "${CYAN}[deploy]${NC}   3. Enable 'Bypass 2FA' and set permission to 'Read and write'" >&2
  echo -e "${CYAN}[deploy]${NC}   4. export NPM_TOKEN=npm_... && bash scripts/deploy.sh" >&2
  exit 1
fi

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

# Derive npm dist-tag from the version prerelease identifier (e.g. "alpha",
# "beta", "rc").  Stable releases (no prerelease) default to "latest".
VERSION="$(node -p "require('./package.json').version")"
PRERELEASE="$(node -p "('$VERSION'.match(/-([\w]+)/)||[])[1]||''")"
NPM_TAG="${PRERELEASE:-latest}"
info "Version: $VERSION  →  dist-tag: $NPM_TAG"

set +e
PUBLISH_OUTPUT="$(npm publish --access public --tag "$NPM_TAG" 2>&1)"
PUBLISH_EXIT=$?
set -e
echo "$PUBLISH_OUTPUT"

if [[ $PUBLISH_EXIT -ne 0 ]]; then
  if echo "$PUBLISH_OUTPUT" | grep -q "Two-factor authentication\|bypass 2fa"; then
    echo -e "${RED}[deploy] ✗${NC} npm publish failed: 2FA bypass required." >&2
    echo -e "${CYAN}[deploy]${NC} Your token doesn't have 2FA bypass enabled." >&2
    echo -e "${CYAN}[deploy]${NC} Fix: create an Automation token at https://www.npmjs.com/settings/~/tokens" >&2
    echo -e "${CYAN}[deploy]${NC}   → Granular Access Token → enable 'Bypass 2FA' → Read and write" >&2
  elif echo "$PUBLISH_OUTPUT" | grep -q "403\|Forbidden\|credentials"; then
    echo -e "${RED}[deploy] ✗${NC} npm publish failed: invalid or expired token." >&2
    echo -e "${CYAN}[deploy]${NC} Verify NPM_TOKEN is a valid Automation token with publish rights." >&2
    echo -e "${CYAN}[deploy]${NC}   https://www.npmjs.com/settings/~/tokens" >&2
  elif echo "$PUBLISH_OUTPUT" | grep -q "404\|not found"; then
    echo -e "${RED}[deploy] ✗${NC} npm publish failed: registry or package not found." >&2
    echo -e "${CYAN}[deploy]${NC} Check the package name in package.json and the registry URL." >&2
  else
    echo -e "${RED}[deploy] ✗${NC} npm publish failed (exit $PUBLISH_EXIT)." >&2
  fi
  exit 1
fi

ok "Published successfully"
