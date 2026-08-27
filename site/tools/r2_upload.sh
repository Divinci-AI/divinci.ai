#!/usr/bin/env bash
# Upload everything r2_migrate.py staged, then VERIFY each object over the
# public URL before anything local is deleted.
#
# --remote matters: wrangler v4 writes to the local simulator by default, so
# without it every upload "succeeds" and nothing reaches the bucket.
set -uo pipefail
cd "$(dirname "$0")/.."

MANIFEST=build/r2-manifest.json
BUCKET=divinci-static-assets
JOBS=${JOBS:-6}
FAIL=build/r2-failed.txt
: > "$FAIL"

ctype() { case "$1" in *.webp) echo image/webp;; *.png) echo image/png;;
                        *.jpg|*.jpeg) echo image/jpeg;; *) echo application/octet-stream;; esac; }
export -f ctype
export BUCKET FAIL

# every key we must ship: the WebP for all, plus the original for OG cards
python3 - "$MANIFEST" > build/r2-keys.txt <<'PY'
import json,sys
m=json.load(open(sys.argv[1]))
for e in m["entries"]:
    if e.get("key"): print(e["key"])
    if e.get("orig_key"): print(e["orig_key"])
PY

COUNT=$(wc -l < build/r2-keys.txt | tr -d ' ')
echo "uploading $COUNT objects to $BUCKET with $JOBS workers..."

upload_one() {
  key="$1"
  src="build/r2/$key"
  [ -f "$src" ] || { echo "MISSING-LOCAL $key" >> "$FAIL"; return; }
  if ! env -u CLOUDFLARE_API_TOKEN wrangler r2 object put "$BUCKET/$key" \
        --file "$src" --content-type "$(ctype "$key")" --remote >/dev/null 2>&1; then
    echo "UPLOAD-FAILED $key" >> "$FAIL"
  fi
}
export -f upload_one

xargs -P "$JOBS" -I{} bash -c 'upload_one "$@"' _ {} < build/r2-keys.txt

echo "verifying over the public URL..."
PUB=$(python3 -c "import json;print(json.load(open('$MANIFEST'))['public'])")
verify_one() {
  key="$1"
  want=$(stat -f%z "build/r2/$key")
  # No range header here: -r 0- makes R2 answer 206, which is correct and which
  # an earlier version of this check then reported as a failure for all 254.
  read -r got len < <(curl -sI "$PUB/$key" |
    awk 'BEGIN{c="";l=""} /^HTTP/{c=$2} tolower($1)=="content-length:"{gsub(/\r/,"",$2);l=$2} END{print c, l}')
  if [ "$got" != "200" ] || [ "$len" != "$want" ]; then
    echo "VERIFY-FAILED $key (http=$got len=$len want=$want)" >> "$FAIL"
  fi
}
export -f verify_one
export PUB

xargs -P 12 -I{} bash -c 'verify_one "$@"' _ {} < build/r2-keys.txt

N=$(wc -l < "$FAIL" | tr -d ' ')
if [ "$N" -eq 0 ]; then
  echo "OK: all $COUNT objects uploaded and verified public"
else
  echo "FAILURES ($N):"; head -20 "$FAIL"; exit 1
fi
