#!/usr/bin/env bash
#
# sync-to-vendor.sh — export this repo's tracked files (no git history) into a
# vendored destination folder, e.g. a subfolder of another repo that
# distributes this project internally.
#
# It mirrors the source repo's committed HEAD into <destination> using rsync
# --delete, so the vendored copy tracks upstream adds, edits, AND removals.
# Build/runtime artifacts (node_modules/, dist/, .env) and this script itself
# are never copied. The destination can declare additional paths it manages
# locally (and that this sync must never overwrite or delete) in a
# `.vendor-sync-ignore` file at its root, one rsync pattern per line.
#
# Usage:
#   scripts/sync-to-vendor.sh <destination-dir>
#   scripts/sync-to-vendor.sh --pull <destination-dir>     # git pull --ff-only first
#   scripts/sync-to-vendor.sh --dry-run <destination-dir>  # preview, change nothing
#   scripts/sync-to-vendor.sh --force <destination-dir>    # allow a name-mismatched dest
#
# Example:
#   scripts/sync-to-vendor.sh ~/workspaces/xcrm/xcrm-standards/jira-mcp
#
set -euo pipefail

# --- Resolve source (the repo this script lives in) --------------------------
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SRC="$(cd "$SCRIPT_DIR/.." && pwd)"
SELF_REL="/${SCRIPT_DIR#"$SRC"/}/$(basename "$0")"  # e.g. /scripts/sync-to-vendor.sh

usage() { sed -n '2,21p' "$0" | sed 's/^# \{0,1\}//'; }

# --- Parse args --------------------------------------------------------------
PULL=false
DRY_RUN=false
FORCE=false
DEST=""
while [ $# -gt 0 ]; do
  case "$1" in
    --pull)        PULL=true ;;
    --dry-run|-n)  DRY_RUN=true ;;
    --force)       FORCE=true ;;
    -h|--help)     usage; exit 0 ;;
    -*)            echo "Unknown option: $1" >&2; exit 2 ;;
    *)
      if [ -z "$DEST" ]; then DEST="$1"
      else echo "Unexpected extra argument: $1" >&2; exit 2; fi ;;
  esac
  shift
done
if [ -z "$DEST" ]; then
  echo "Error: destination directory is required." >&2
  echo "Usage: $(basename "$0") [--pull] [--dry-run] [--force] <destination-dir>" >&2
  exit 2
fi

# --- Normalize destination ---------------------------------------------------
DEST="${DEST/#\~/$HOME}"          # expand a quoted leading ~
mkdir -p "$DEST"
DEST="$(cd "$DEST" && pwd)"       # absolute, normalized

if [ "$DEST" = "$SRC" ]; then
  echo "Error: destination is the source repo itself." >&2
  exit 2
fi

# --- Sanity checks -----------------------------------------------------------
command -v rsync >/dev/null || { echo "rsync is required but not found." >&2; exit 1; }
[ -f "$SRC/package.json" ] || { echo "No package.json at source root: $SRC" >&2; exit 1; }

pkg_name() { sed -n 's/.*"name"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$1" | head -1; }
SRC_NAME="$(pkg_name "$SRC/package.json")"

# Footgun guard for rsync --delete: a non-empty destination must look like this
# project (or a fresh/empty dir). Override an unrelated-but-intentional dest
# with --force.
if [ -n "$(ls -A "$DEST")" ]; then
  if [ ! -f "$DEST/package.json" ]; then
    echo "Refusing to --delete into a non-empty destination with no package.json:" >&2
    echo "  $DEST" >&2
    echo "Point at a fresh dir or the existing vendored copy (or pass --force)." >&2
    [ "$FORCE" = true ] || exit 1
  else
    DEST_NAME="$(pkg_name "$DEST/package.json")"
    if [ "$DEST_NAME" != "$SRC_NAME" ]; then
      echo "Destination package name '$DEST_NAME' != source '$SRC_NAME'." >&2
      [ "$FORCE" = true ] || { echo "Pass --force if this is intentional." >&2; exit 1; }
    fi
  fi
fi

# --- Optionally fast-forward the source repo ---------------------------------
if [ "$PULL" = true ]; then
  echo "==> git pull --ff-only in $SRC"
  git -C "$SRC" pull --ff-only
fi

if [ ! -d "$SRC/.git" ]; then
  echo "Source is not a git repo: $SRC" >&2
  exit 1
fi
SRC_HEAD="$(git -C "$SRC" rev-parse --short HEAD)"
echo "==> Exporting $SRC_NAME @ $SRC_HEAD  ->  $DEST"
if ! git -C "$SRC" diff --quiet || ! git -C "$SRC" diff --cached --quiet; then
  echo "    (note: source has uncommitted changes; only committed HEAD is exported)"
fi

# --- Export tracked files at HEAD into a temp dir ----------------------------
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
git -C "$SRC" archive HEAD | tar -x -C "$TMP"

# --- Build rsync excludes ----------------------------------------------------
# Always protected: VCS/runtime/secret artifacts and this script itself. These
# are skipped on copy AND protected from --delete in the destination.
RSYNC_FLAGS=(
  -a --delete --itemize-changes
  --exclude=/.git/
  --exclude=/node_modules/
  --exclude=/dist/
  --exclude=/.env
  --exclude=/.vendor-sync-ignore
  "--exclude=$SELF_REL"
)
# Destination-declared local files (e.g. .github/, AGENTS.md) it manages itself.
if [ -f "$DEST/.vendor-sync-ignore" ]; then
  echo "    Honoring $DEST/.vendor-sync-ignore"
  RSYNC_FLAGS+=( "--exclude-from=$DEST/.vendor-sync-ignore" )
fi
[ "$DRY_RUN" = true ] && { RSYNC_FLAGS+=( --dry-run ); echo "==> DRY RUN — no files will be modified"; }

# Trailing slashes: copy the CONTENTS of $TMP into $DEST.
rsync "${RSYNC_FLAGS[@]}" "$TMP/" "$DEST/"

echo "==> Done."
if [ "$DRY_RUN" = false ]; then
  echo "    Review in the vendor repo:  git -C <vendor-repo> status"
  echo "    If package-lock changed:    (cd \"$DEST\" && npm ci)"
fi
