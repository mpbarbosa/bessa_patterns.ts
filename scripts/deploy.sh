#!/usr/bin/env bash
# scripts/deploy.sh — Build, publish bessa_patterns.ts to npm, and enable CDN delivery
# Invoked by: ai-workflow deploy
# Guards: NPM_TOKEN must be set, tests must pass, build must succeed

set -euo pipefail

# ── Cleanup ───────────────────────────────────────────────────────────────────
cleanup() {
  rm -f "${PROJECT_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}/.npmrc"
}
trap cleanup EXIT

# ── Colour helpers ────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; YELLOW='\033[0;33m'; NC='\033[0m'
info()  { echo -e "${CYAN}[deploy]${NC} $*"; }
ok()    { echo -e "${GREEN}[deploy] ✓${NC} $*"; }
warn()  { echo -e "${YELLOW}[deploy] ⚠${NC} $*"; }
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

# ── Read version info ─────────────────────────────────────────────────────────
PACKAGE_NAME="$(node -p "require('./package.json').name")"
VERSION="$(node -p "require('./package.json').version")"
PRERELEASE="$(node -p "('$VERSION'.match(/-([\w]+)/)||[])[1]||''")"
NPM_TAG="${PRERELEASE:-latest}"
TAG="v${VERSION}"

echo ""
echo -e "${CYAN}╔════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   bessa_patterns.ts  ·  Deploy             ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════╝${NC}"
echo ""
info "Project root : $PROJECT_ROOT"
info "Version      : $VERSION"
info "dist-tag     : $NPM_TAG"
info "Git tag      : $TAG"
echo ""

# ── Step 1/5 — CDN delivery (commit artifacts, tag & push) ───────────────────
info "Step 1/5 — Enabling CDN delivery …"

# Stage compiled dist/ artifacts (force-add: dist/ is intentionally in .gitignore
# but must be committed for jsDelivr CDN delivery)
git add -f dist/
if git diff --cached --quiet; then
  warn "Build artifacts unchanged — skipping commit"
else
  git commit -m "chore: build artifacts for ${TAG}

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
  ok "Committed build artifacts"
fi

# Detect current branch
CURRENT_BRANCH="$(git branch --show-current)"
if [[ -z "${CURRENT_BRANCH}" ]]; then
  fail "Could not determine current git branch (detached HEAD?)"
fi

# Pull latest changes before pushing to avoid non-fast-forward rejection
git pull --rebase origin "${CURRENT_BRANCH}"

# Create version tag (skip if already exists)
if git rev-parse "${TAG}" >/dev/null 2>&1; then
  warn "Tag ${TAG} already exists — skipping tag creation"
else
  git tag "${TAG}"
  ok "Created tag ${TAG}"
fi

git push origin "${CURRENT_BRANCH}" --tags
ok "Pushed to origin/${CURRENT_BRANCH}"
echo ""

# ── Generate jsDelivr CDN URLs ────────────────────────────────────────────────
info "jsDelivr CDN URLs for ${PACKAGE_NAME}@${VERSION}:"
echo ""
echo -e "  ${GREEN}Latest (dist-tag: ${NPM_TAG})${NC}"
echo "    https://cdn.jsdelivr.net/npm/${PACKAGE_NAME}@${NPM_TAG}/dist/index.mjs"
echo "    https://cdn.jsdelivr.net/npm/${PACKAGE_NAME}@${NPM_TAG}/dist/index.cjs"
echo ""
echo -e "  ${GREEN}Pinned (version: ${VERSION})${NC}"
echo "    https://cdn.jsdelivr.net/npm/${PACKAGE_NAME}@${VERSION}/dist/index.mjs"
echo "    https://cdn.jsdelivr.net/npm/${PACKAGE_NAME}@${VERSION}/dist/index.cjs"
echo "    https://cdn.jsdelivr.net/npm/${PACKAGE_NAME}@${VERSION}/dist/index.d.ts"
echo ""

# ── Step 2/5 — Install dependencies ──────────────────────────────────────────
info "Step 2/5 — Installing dependencies …"
npm ci --prefer-offline --no-audit
ok "Dependencies installed"
echo ""

# ── Step 3/5 — Test ──────────────────────────────────────────────────────────
info "Step 3/5 — Running tests …"
npm test || fail "Tests failed. Aborting deploy."
ok "Tests passed"
echo ""

# ── Step 4/5 — Build (Vite) ──────────────────────────────────────────────────
info "Step 4/5 — Building with Vite (ESM + CJS + types) …"
npm run build:vite || fail "Vite build failed. Aborting deploy."
ok "Build complete (dist/index.mjs · dist/index.cjs · dist/index.d.ts)"
echo ""

# ── Step 5/5 — Publish to npm ────────────────────────────────────────────────
info "Step 5/5 — Publishing to npm …"
echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > "$PROJECT_ROOT/.npmrc"

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

ok "Published ${PACKAGE_NAME}@${VERSION} to npm (tag: ${NPM_TAG})"
echo ""

ok "Deployment of ${TAG} complete! 🚀"
echo ""
