#!/usr/bin/env bash
# Deploy the NIWA web app to Vercel (docs/OPS.md §6, §10). Repeatable; no dashboard steps needed except
# (optionally) installing Vercel's GitHub app so pushes to main deploy automatically.
#   1. creates or updates the 'niwa' project (Vite, root directory web_app, pnpm via corepack)
#   2. sets the public build env (VITE_*)
#   3. points the /api rewrite at the Render API (arg 1, default https://niwa-api.onrender.com)
#   4. links this checkout and deploys to production with the Vercel CLI
#
# Usage: bash scripts/deploy/vercel.sh [https://<render-service>.onrender.com]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ENV_FILE="$ROOT/scripts/deploy/deploy.env"
PROJECT="niwa"
REPO="PastelSalt/niwa"
API_ORIGIN="${1:-https://niwa-api.onrender.com}"
VERCEL=(npx -y vercel@65.11.0)
API="https://api.vercel.com"

die() { echo "✗ $*" >&2; exit 1; }
[[ -f "$ENV_FILE" ]] || die "Missing $ENV_FILE — copy deploy.env.example and fill it in."
set -a; source "$ENV_FILE"; set +a
[[ -n "${VERCEL_TOKEN:-}" ]] || die "VERCEL_TOKEN is empty in deploy.env."

vercel_api() { # method path [json-body] → prints body; returns the HTTP status via $STATUS
  local out; out="$(mktemp)"
  STATUS="$(curl -sS -o "$out" -w '%{http_code}' -X "$1" "$API$2" \
    -H "Authorization: Bearer $VERCEL_TOKEN" ${3:+-H 'Content-Type: application/json' --data "$3"})"
  cat "$out"; rm -f "$out"
}

SETTINGS='{"framework":"vite","rootDirectory":"web_app","installCommand":"pnpm install --frozen-lockfile --filter @niwa/web...","buildCommand":"pnpm build","outputDirectory":"dist","sourceFilesOutsideRootDirectory":true,"nodeVersion":"24.x"}'

vercel_api GET "/v9/projects/$PROJECT" >/dev/null
if [[ "$STATUS" == 404 ]]; then
  body="$(python3 -c "import json; s=json.loads('$SETTINGS'); s.update(name='$PROJECT', gitRepository={'type':'github','repo':'$REPO'}); print(json.dumps(s))")"
  vercel_api POST "/v11/projects" "$body" >/dev/null
  if [[ "$STATUS" != 200 ]]; then
    echo "• Couldn't connect GitHub ($STATUS) — creating the project without Git (CLI deploys only)."
    echo "  To deploy on every push: install the Vercel GitHub app for $REPO, then connect it in the project."
    body="$(python3 -c "import json; s=json.loads('$SETTINGS'); s.update(name='$PROJECT'); print(json.dumps(s))")"
    vercel_api POST "/v11/projects" "$body" >/dev/null
    [[ "$STATUS" == 200 ]] || die "Creating the Vercel project failed (HTTP $STATUS)."
  fi
  echo "✓ created project $PROJECT"
else
  [[ "$STATUS" == 200 ]] || die "Vercel API call failed (HTTP $STATUS) — check VERCEL_TOKEN."
  vercel_api PATCH "/v9/projects/$PROJECT" "$SETTINGS" >/dev/null
  [[ "$STATUS" == 200 ]] || die "Updating project settings failed (HTTP $STATUS)."
  echo "✓ project $PROJECT settings up to date"
fi

# Public build-time values only (VITE_* is bundled into the JS). Corepack makes Vercel use the pnpm
# version pinned in package.json.
ENV_BODY='[
 {"key":"VITE_API_BASE","value":"/api/v1","type":"plain","target":["production","preview"]},
 {"key":"VITE_APP_ENV","value":"production","type":"plain","target":["production"]},
 {"key":"ENABLE_EXPERIMENTAL_COREPACK","value":"1","type":"plain","target":["production","preview"]}
]'
vercel_api POST "/v10/projects/$PROJECT/env?upsert=true" "$ENV_BODY" >/dev/null
[[ "$STATUS" == 200 || "$STATUS" == 201 ]] || die "Setting env vars failed (HTTP $STATUS)."
echo "✓ build env set"

# The rewrite keeps the refresh cookie first-party (OPS §6.1). Changing it is a repo change: commit it
# so Git deploys use it too.
API_ORIGIN="$API_ORIGIN" python3 - "$ROOT/web_app/vercel.json" <<'PY'
import json, os, sys
path = sys.argv[1]
cfg = json.load(open(path))
want = os.environ["API_ORIGIN"].rstrip("/") + "/api/:path*"
for r in cfg["rewrites"]:
    if r["source"] == "/api/:path*" and r["destination"] != want:
        r["destination"] = want
        json.dump(cfg, open(path, "w"), indent=2)
        open(path, "a").write("\n")
        print(f"✓ /api rewrite → {want} (commit web_app/vercel.json)")
        break
else:
    print(f"✓ /api rewrite already → {want}")
PY

cd "$ROOT"
"${VERCEL[@]}" link --yes --project "$PROJECT" --token "$VERCEL_TOKEN" >/dev/null
URL="$("${VERCEL[@]}" deploy --prod --yes --token "$VERCEL_TOKEN")"
echo "✓ deployed: $URL"
echo "Next: add the production origin to CORS_ORIGINS in deploy.env, then: bash scripts/deploy/render.sh --env-only"
