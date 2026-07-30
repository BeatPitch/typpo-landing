#!/usr/bin/env bash
# Transcode the raw pickTemplate.mov screen recording into a lean, web-ready MP4
# for card 01 ("pick a look") of the Typpo landing page.
#
# Re-run this any time you replace pickTemplate.mov:
#     ./videos/encode.sh
#
# Output settings: H.264 (universal browser support), 720px wide (plenty for the
# ~270px card even on retina), 30fps, audio stripped (muted autoplay loop),
# +faststart for progressive playback. The <video> in the page already points at
# videos/pickTemplate.mp4, so no HTML changes are needed after re-encoding.
set -euo pipefail
cd "$(dirname "$0")"

SRC="${1:-pickTemplate.mov}"
OUT="${2:-pickTemplate.mp4}"

if [[ ! -f "$SRC" ]]; then
  echo "error: source '$SRC' not found in $(pwd)" >&2
  exit 1
fi

echo "encoding $SRC -> $OUT ..."
ffmpeg -y -hide_banner -loglevel error -i "$SRC" \
  -an \
  -vf "fps=30,scale=720:-2" \
  -c:v libx264 -profile:v high -pix_fmt yuv420p -preset veryslow -crf 24 \
  -movflags +faststart \
  "$OUT"

echo "done: $OUT ($(du -h "$OUT" | cut -f1)) — hard-refresh (Cmd+Shift+R) at http://localhost:8080"
