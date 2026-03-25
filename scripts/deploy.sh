#!/usr/bin/env bash
# ==============================================================================
# Deploy Script for bessa_patterns.ts
# ==============================================================================
# Installs dependencies, runs tests, builds dual CJS+ESM bundles, commits the
# compiled artifacts, creates a version tag, pushes to GitHub, generates
# jsDelivr CDN URLs, and publishes to npm.
#
# Usage:
#   export NPM_TOKEN=npm_...
#   bash scripts/deploy.sh
#   ai-workflow deploy          # via ai_workflow.js deploy command
#
# Guards:
#   NPM_TOKEN must be set; tests must pass; build must succeed.
# ==============================================================================

set -euo pipefail

# ── Cleanup ───────────────────────────────────────────────────────────────────
cleanup() {
  rm -f "${PROJECT_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}/.npmrc"
}
trap cleanup EXIT

# ── Colors ────────────────────────────────────────────────────────────────────
# shellcheck source=scripts/colors.sh
source "$(dirname "${BASH_SOURCE[0]}")/colors.sh"

info()    { echo -e "${CYAN}[deploy]${NC} $*"; }
success() { echo -e "${GREEN}[deploy] ✓${NC} $*"; }
warn()    { echo -e "${YELLOW}[deploy] ⚠${NC} $*"; }
error()   { echo -e "${RED}[deploy] ✗${NC} $*" >&2; }
fail()    { error "$*"; exit 1; }

# ── Guards ────────────────────────────────────────────────────────────────────
if [[ -z "${NPM_TOKEN:-}" ]]; then
  error "NPM_TOKEN is not set."
  info  "To fix this, create an Automation token on npm:"
  info  "  1. Go to https://www.npmjs.com/settings/~/tokens"
  info  "  2. Generate New Token → Granular Access Token"
  info  "  3. Enable 'Bypass 2FA' and set permission to 'Read and write'"
  info  "  4. export NPM_TOKEN=npm_... && bash scripts/deploy.sh"
  exit 1
fi

command -v npm >/dev/null 2>&1 || fail "npm not found on PATH."

# ── Resolve project root ──────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${PROJECT_ROOT}"

# ── Read version info ─────────────────────────────────────────────────────────
PACKAGE_NAME="$(node -p "require('./package.json').name")"
PACKAGE_VERSION="$(node -p "require('./package.json').version")"
PRERELEASE="$(node -p "('${PACKAGE_VERSION}'.match(/-([\w]+)/)||[])[1]||''")"
NPM_TAG="${PRERELEASE:-latest}"
TAG="v${PACKAGE_VERSION}"

echo ""
echo -e "${CYAN}╔════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   bessa_patterns.ts  ·  Deploy             ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════╝${NC}"
echo ""
info "Project root : ${PROJECT_ROOT}"
info "Version      : ${PACKAGE_VERSION}"
info "dist-tag     : ${NPM_TAG}"
info "Git tag      : ${TAG}"
echo ""

# ── Step 1/5 — Install dependencies ──────────────────────────────────────────
info "Step 1/5 — Installing dependencies …"
npm ci --prefer-offline --no-audit
success "Dependencies installed"
echo ""

# ── Step 2/5 — Test ──────────────────────────────────────────────────────────
info "Step 2/5 — Running tests …"
npm test || fail "Tests failed. Aborting deploy."
success "Tests passed"
echo ""

# ── Step 3/5 — Build (Vite) ──────────────────────────────────────────────────
info "Step 3/5 — Building with Vite (ESM + CJS + types) …"
npm run build:vite || fail "Vite build failed. Aborting deploy."
success "Build complete (dist/index.mjs · dist/index.cjs · dist/index.d.ts)"
echo ""

# ── Step 4/5 — Commit artifacts, tag & push ──────────────────────────────────
info "Step 4/5 — Enabling CDN delivery …"

# Detect current branch dynamically (avoids hardcoding 'main')
CURRENT_BRANCH="$(git branch --show-current)"
if [[ -z "${CURRENT_BRANCH}" ]]; then
  fail "Could not determine current git branch (detached HEAD?)"
fi

# Stage compiled dist/ artifacts (force-add: dist/ is intentionally in .gitignore
# but must be committed for jsDelivr CDN delivery)
git add -f dist/
if git diff --cached --quiet; then
  warn "Build artifacts unchanged — skipping commit"
else
  git commit -m "chore: build artifacts for ${TAG}

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
  success "Committed build artifacts"
fi

# Pull latest remote changes before pushing to avoid non-fast-forward rejection
git pull --rebase origin "${CURRENT_BRANCH}"

# Create version tag (skip if it already exists)
if git rev-parse "${TAG}" >/dev/null 2>&1; then
  warn "Tag ${TAG} already exists — skipping tag creation"
else
  git tag "${TAG}"
  success "Created tag ${TAG}"
fi

git push origin "${CURRENT_BRANCH}" --tags
success "Pushed to origin/${CURRENT_BRANCH}"
echo ""

# ── Generate jsDelivr CDN URLs ────────────────────────────────────────────────
info "jsDelivr CDN URLs for ${PACKAGE_NAME}@${PACKAGE_VERSION}:"
echo ""
echo -e "  ${GREEN}Latest (dist-tag: ${NPM_TAG})${NC}"
echo "    https://cdn.jsdelivr.net/npm/${PACKAGE_NAME}@${NPM_TAG}/dist/index.mjs"
echo "    https://cdn.jsdelivr.net/npm/${PACKAGE_NAME}@${NPM_TAG}/dist/index.cjs"
echo ""
echo -e "  ${GREEN}Pinned (version: ${PACKAGE_VERSION})${NC}"
echo "    https://cdn.jsdelivr.net/npm/${PACKAGE_NAME}@${PACKAGE_VERSION}/dist/index.mjs"
echo "    https://cdn.jsdelivr.net/npm/${PACKAGE_NAME}@${PACKAGE_VERSION}/dist/index.cjs"
echo "    https://cdn.jsdelivr.net/npm/${PACKAGE_NAME}@${PACKAGE_VERSION}/dist/index.d.ts"
echo ""

# ── Step 5/5 — Publish to npm ────────────────────────────────────────────────
info "Step 5/5 — Publishing to npm …"
echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > "${PROJECT_ROOT}/.npmrc"

set +e
PUBLISH_OUTPUT="$(npm publish --access public --tag "${NPM_TAG}" 2>&1)"
PUBLISH_EXIT=$?
set -e
echo "${PUBLISH_OUTPUT}"

if [[ ${PUBLISH_EXIT} -ne 0 ]]; then
  if echo "${PUBLISH_OUTPUT}" | grep -q "Two-factor authentication\|bypass 2fa"; then
    error "npm publish failed: 2FA bypass required."
    info  "Your token doesn't have 2FA bypass enabled."
    info  "Fix: create an Automation token at https://www.npmjs.com/settings/~/tokens"
    info  "  → Granular Access Token → enable 'Bypass 2FA' → Read and write"
  elif echo "${PUBLISH_OUTPUT}" | grep -q "403\|Forbidden\|credentials"; then
    error "npm publish failed: invalid or expired token."
    info  "Verify NPM_TOKEN is a valid Automation token with publish rights."
    info  "  https://www.npmjs.com/settings/~/tokens"
  elif echo "${PUBLISH_OUTPUT}" | grep -q "404\|not found"; then
    error "npm publish failed: registry or package not found."
    info  "Check the package name in package.json and the registry URL."
  else
    error "npm publish failed (exit ${PUBLISH_EXIT})."
  fi
  exit 1
fi

success "Published ${PACKAGE_NAME}@${PACKAGE_VERSION} to npm (tag: ${NPM_TAG})"
echo ""

success "Deployment of ${TAG} complete! 🚀"
echo ""

