#!/bin/bash
# Scheduled refresh of the RAG Universe poster and its unfurl card.
#
# WHY LOCAL AND NOT GITHUB ACTIONS.
# gen-og-images.mjs sets the card type in Georgia via SVG. ubuntu-latest has no
# Georgia, so a CI run would silently re-typeset the card in a fallback serif —
# and since the generator rewrites all 67 cards, a scheduled CI job would commit
# 67 subtly-degraded images every week. Installing ttf-mscorefonts-installer
# would fix that, but the deploy is a local `wrangler deploy` against a Keychain
# OAuth token anyway, so CI could never finish the job it started.
#
# ⛔ DO NOT WIRE THIS INTO A LaunchAgent. Measured 2026-08-22: a launchd-spawned
# /bin/bash cannot READ this repo. The checkout lives under ~/Documents, which is
# TCC-protected, and TCC grants attach to the INTERPRETER, not the script — so
# the only way to make it work is to give /bin/bash Full Disk Access, i.e. every
# command on the machine. The failure is also easy to misread:
#
#     ls  /Users/…/site/package.json   ->  succeeds, prints the size
#     cat /Users/…/site/package.json   ->  Operation not permitted
#
# stat() is allowed and open() is denied, so `[ -r "$f" ]` returns TRUE and the
# job then dies somewhere further in. Run this from a terminal session, which
# already holds Documents access.
#
# The thing that actually enforces freshness without a daemon is
# check-universe-freshness.mjs, wired into every wrangler build command: a deploy
# with figures older than 45 days fails. That covers the case this script exists
# for — a stale, undated figure on every share of the page — at the only moment
# it can still be fixed.
#
# WHAT IT DOES NOT DO: it does not push to main and it does not deploy. It opens
# a PR, because the output is a PICTURE — a capture can come out wrong in ways no
# assertion catches, and a human should look at it before it becomes the image
# every share of that page carries.
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SITE="$REPO/site"
LOG="${HOME}/Library/Logs/divinci-universe-refresh.log"
LOCKDIR="/tmp/divinci-universe-refresh.lock"

mkdir -p "$(dirname "$LOG")"
exec >>"$LOG" 2>&1
echo "=== $(date '+%Y-%m-%d %H:%M:%S') starting"

# Never two at once, and never queue behind one that died.
#
# mkdir, not flock: macOS ships no flock(1), and a lock built on `[ -e ]` then
# `touch` is not atomic — two jobs firing on the same schedule can both pass the
# test. mkdir either creates the directory or fails, in one syscall.
if ! mkdir "$LOCKDIR" 2>/dev/null; then
	HOLDER="$(cat "$LOCKDIR/pid" 2>/dev/null || true)"
	if [ -n "$HOLDER" ] && kill -0 "$HOLDER" 2>/dev/null; then
		echo "refresh already running (pid $HOLDER) — skipping"
		exit 0
	fi
	echo "clearing a lock left by dead pid ${HOLDER:-unknown}"
	rm -rf "$LOCKDIR"
	mkdir "$LOCKDIR" || { echo "lost the race for the lock — skipping"; exit 0; }
fi
echo $$ >"$LOCKDIR/pid"
trap 'rm -rf "$LOCKDIR"' EXIT

cd "$SITE"

# The ONLY paths this job may commit. Several agents share this checkout, so a
# bare `git add -A` here could sweep up someone else's in-progress work and ship
# it under a message about a poster.
PATHS=(
	"site/static/images/marketing/www-rag/universe-poster.webp"
	"site/static/js/www-rag-universe.js"
	"site/scripts/og-assets/figures.json"
	"site/static/images/og/www-rag.jpg"
)

if ! npm run refresh:universe; then
	echo "refresh FAILED — nothing committed"
	exit 1
fi

cd "$REPO"

# gen-og-images rewrites every card. If any card OTHER than www-rag changed, the
# cause is not this job (a content edit, a font change, a hero swap) and quietly
# leaving those dirty is how an unrelated change rides along in someone else's
# next commit. Say so and stop.
STRAY="$(git status --porcelain -- site/static/images/og \
	| grep -v 'site/static/images/og/www-rag.jpg' || true)"
if [ -n "$STRAY" ]; then
	echo "other OG cards changed — not this job's doing, leaving everything alone:"
	echo "$STRAY"
	exit 1
fi

if [ -z "$(git status --porcelain -- "${PATHS[@]}")" ]; then
	echo "nothing changed — corpus figures and picture are already current"
	exit 0
fi

if [ "${1:-}" = "--dry-run" ]; then
	echo "--dry-run: would commit these paths, opening no PR:"
	git status --porcelain -- "${PATHS[@]}"
	exit 0
fi

BRANCH="chore/universe-poster-$(date '+%Y-%m-%d')"
FIGURES="$(python3 -c "import json;print(json.load(open('site/scripts/og-assets/figures.json'))['www-rag']['line'])")"

git fetch origin --quiet
git switch --quiet --create "$BRANCH" origin/main 2>/dev/null || git switch --quiet "$BRANCH"
git add -- "${PATHS[@]}"
git commit --quiet -m "chore(www-rag): refresh the universe poster and its unfurl card

$FIGURES

Captured from production by scripts/gen-universe-poster.mjs. The caption and
the card's figures strip are written from the SAME capture, so they cannot
disagree; tests/unit/caption-source.test.mjs fails if they ever do."
git push --quiet -u origin "$BRANCH"

gh pr create \
	--title "chore(www-rag): refresh the universe poster ($FIGURES)" \
	--body "Scheduled refresh from \`site/scripts/refresh-universe-local.sh\`.

**$FIGURES**

Please LOOK AT THE PICTURE before merging — the capture waits for the layout to
come to rest, but a settled layout is not necessarily a good one.

Merging does not publish it: the site deploys manually with
\`cd site && env -u CLOUDFLARE_API_TOKEN wrangler deploy --env=\"\"\`." \
	--base main --head "$BRANCH"

git switch --quiet -
echo "opened PR from $BRANCH"
