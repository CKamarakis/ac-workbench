#!/bin/sh
# Block real project names and details (spec: repo-privacy "Private words blocked at commit").
# The list is .private-words at the repo root (gitignored): one entry per line, whole word, any case.
# Usage: private-words.sh staged | private-words.sh message <file>
# Never prints a matched word, only where it was found.

ROOT=$(git rev-parse --show-toplevel) || exit 1
LIST="$ROOT/.private-words"
PAT=$(mktemp) || exit 1
trap 'rm -f "$PAT"' EXIT

[ -f "$LIST" ] && tr -d '\r' < "$LIST" | grep -v '^[[:space:]]*#' | grep -v '^[[:space:]]*$' > "$PAT"
if [ ! -s "$PAT" ]; then
  echo "private-words: no .private-words list (or it's empty); real names are not checked." >&2
  exit 0
fi

found=0
case "$1" in
  staged)
    # Added lines and the paths of added, copied, modified or renamed files; deletions always pass.
    git -C "$ROOT" diff --cached --name-only -z --diff-filter=ACMR | tr '\0' '\n' > "$PAT.files"
    while IFS= read -r f; do
      [ -n "$f" ] || continue
      if printf '%s\n' "$f" | grep -iwqF -f "$PAT" ||
         git -C "$ROOT" diff --cached -U0 --no-color -- "$f" | grep '^+' | grep -v '^+++ ' | grep -iwqF -f "$PAT"; then
        echo "private-words: a listed word is in $f" >&2
        found=1
        continue
      fi
      # Images show no text lines in a diff: read their metadata (EXIF, XMP, PNG text) instead.
      case "$f" in
        *.[pP][nN][gG]|*.[jJ][pP][gG]|*.[jJ][pP][eE][gG]|*.[wW][eE][bB][pP])
          if ! command -v node >/dev/null 2>&1; then
            echo "private-words: node not found; image metadata in $f not checked" >&2
          elif git -C "$ROOT" show ":$f" | node "$(dirname "$0")/image-text.mjs" | grep -iwqF -f "$PAT"; then
            echo "private-words: a listed word is in the metadata of $f" >&2
            found=1
          fi ;;
      esac
    done < "$PAT.files"
    rm -f "$PAT.files"
    ;;
  message)
    if grep -v '^#' "$2" | grep -iwqF -f "$PAT"; then
      echo "private-words: a listed word is in the commit message" >&2
      found=1
    fi
    ;;
  *) echo "usage: private-words.sh staged | message <file>" >&2; exit 2 ;;
esac

if [ "$found" = 1 ]; then
  echo "private-words: commit blocked. Use the alias (Acme) instead; the list is .private-words." >&2
  exit 1
fi
exit 0
