#!/usr/bin/env bash
# Deploy the NIWA API to Render (docs/OPS.md §5, §10).
#
# One-time, by hand: create the Blueprint from render.yaml (the script prints the link) — Render has no
# API/CLI call that creates a Blueprint from a repo. After that this script is repeatable:
#   1. validates render.yaml (Render CLI, if installed)
#   2. finds the niwa-api service
#   3. sets the secret env vars (sync:false) from scripts/deploy/deploy.env
#   4. triggers a deploy and waits for it, then checks /api/v1/health
#
# Usage: bash scripts/deploy/render.sh [--env-only|--deploy-only]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ENV_FILE="$ROOT/scripts/deploy/deploy.env"
SERVICE_NAME="niwa-api"
REPO_URL="https://github.com/PastelSalt/niwa"
API="https://api.render.com/v1"
MODE="${1:-all}"

die() { echo "✗ $*" >&2; exit 1; }
[[ -f "$ENV_FILE" ]] || die "Missing $ENV_FILE — copy deploy.env.example and fill it in."
set -a; source "$ENV_FILE"; set +a
[[ -n "${RENDER_API_KEY:-}" ]] || die "RENDER_API_KEY is empty in deploy.env."

render_api() { # method path [json-body]
  curl -fsS -X "$1" "$API$2" \
    -H "Authorization: Bearer $RENDER_API_KEY" -H 'Accept: application/json' \
    ${3:+-H 'Content-Type: application/json' --data "$3"}
}
json() { python3 -c "import json,sys; d=json.load(sys.stdin); print($1)"; }

if command -v render >/dev/null; then
  render blueprints validate "$ROOT/render.yaml" && echo "✓ render.yaml is valid"
else
  echo "• Render CLI not installed — skipping blueprint validation (optional)."
fi

SERVICE_JSON="$(render_api GET "/services?name=$SERVICE_NAME&limit=20")" ||
  die "Render API call failed — check RENDER_API_KEY."
SERVICE_ID="$(json "next((s['service']['id'] for s in d if s['service']['name']=='$SERVICE_NAME'), '')" <<<"$SERVICE_JSON")"
if [[ -z "$SERVICE_ID" ]]; then
  echo "✗ No '$SERVICE_NAME' service yet. Create it once from the Blueprint:"
  echo "    https://dashboard.render.com/blueprint/new?repo=$REPO_URL"
  echo "  (Render asks for the sync:false values there; you can leave them blank and rerun this script.)"
  exit 1
fi
SERVICE_URL="$(json "next((s['service']['serviceDetails'].get('url','') for s in d if s['service']['id']=='$SERVICE_ID'), '')" <<<"$SERVICE_JSON")"
echo "✓ $SERVICE_NAME → $SERVICE_ID ${SERVICE_URL:+($SERVICE_URL)}"

if [[ "$MODE" != "--deploy-only" ]]; then
  for key in MONGODB_URI CORS_ORIGINS CLOUDINARY_CLOUD_NAME CLOUDINARY_API_KEY CLOUDINARY_API_SECRET; do
    value="${!key:-}"
    if [[ -z "$value" ]]; then echo "• $key empty — left as it is on Render"; continue; fi
    body="$(VALUE="$value" python3 -c 'import json,os; print(json.dumps({"value": os.environ["VALUE"]}))')"
    render_api PUT "/services/$SERVICE_ID/env-vars/$key" "$body" >/dev/null
    echo "✓ set $key"
  done
fi
[[ "$MODE" == "--env-only" ]] && exit 0

DEPLOY_ID="$(render_api POST "/services/$SERVICE_ID/deploys" '{}' | json "d['id']")"
echo "… deploy $DEPLOY_ID started (free plan builds take a few minutes)"
while :; do
  sleep 15
  status="$(render_api GET "/services/$SERVICE_ID/deploys/$DEPLOY_ID" | json "d['status']")"
  echo "  $status"
  case "$status" in
    live) break ;;
    build_failed|update_failed|canceled|deactivated|pre_deploy_failed)
      die "Deploy $status — see the Render dashboard logs. (A MongoDB connection failure shows up as update_failed.)" ;;
  esac
done

if [[ -n "$SERVICE_URL" ]]; then
  curl -fsS "$SERVICE_URL/api/v1/health" && echo && echo "✓ $SERVICE_URL is healthy"
  echo "Next: bash scripts/deploy/vercel.sh $SERVICE_URL"
fi
