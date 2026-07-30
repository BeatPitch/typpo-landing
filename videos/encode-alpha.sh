#!/bin/bash
# Transparent-video web pipeline: SRC.mov (with alpha) -> NAME-alpha.mov (HEVC+alpha, Safari)
#                                                       + NAME.webm      (VP9+alpha, Chrome/Firefox)
# Usage: ./videos/encode-alpha.sh videos/SpellDesign.mov [max_width]
# Keeps transparency in both outputs. max_width defaults to 720.
set -euo pipefail
SRC="$1"
W="${2:-720}"
[ -f "$SRC" ] || { echo "source not found: $SRC"; exit 1; }

DIR="$(dirname "$SRC")"
BASE="$(basename "$SRC")"; NAME="${BASE%.*}"
OUT_MOV="$DIR/${NAME}-alpha.mov"
OUT_WEBM="$DIR/${NAME}.webm"

PIX=$(ffprobe -v error -select_streams v:0 -show_entries stream=pix_fmt -of default=noprint_wrappers=1:nokey=1 "$SRC")
echo "source pix_fmt: $PIX"
case "$PIX" in
  *a|yuva*|*rgba*|*bgra*|*4444*) echo "alpha channel: present ✓" ;;
  *) echo "WARNING: source may have NO alpha ($PIX) — outputs will be opaque." ;;
esac

echo "— encoding HEVC+alpha (Safari) …"
ffmpeg -y -loglevel error -i "$SRC" \
  -vf "scale=${W}:-2,fps=30,format=bgra" \
  -c:v hevc_videotoolbox -allow_sw 1 -alpha_quality 0.75 -q:v 55 -tag:v hvc1 -an \
  "$OUT_MOV"

echo "— encoding VP9+alpha (Chrome/Firefox) …"
ffmpeg -y -loglevel error -i "$SRC" \
  -vf "scale=${W}:-2,fps=30,format=yuva420p" \
  -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 0 -crf 33 -row-mt 1 -deadline good -cpu-used 2 -auto-alt-ref 0 -an \
  "$OUT_WEBM"

echo "— done:"
ls -lh "$SRC" "$OUT_MOV" "$OUT_WEBM" | awk '{print $5"\t"$9}'
