#!/usr/bin/env bash
# Erzeugt aus einem Hochformat-Original (9:16, z.B. Instagram-Export) alles, was die Startseite braucht:
#   public/video/hero/master.m3u8 + 360p/540p/720p   adaptives HLS (Player wählt Qualität nach Bandbreite)
#   public/video/hero/hero-720.mp4                   Fallback für Browser ohne HLS
#   public/video/hero/poster.jpg                     erstes Frame
#
# Nutzung:  scripts/encode-hero-video.sh pfad/zum/original.mp4
# Voraussetzung: ffmpeg (brew install ffmpeg)
set -euo pipefail

IN="${1:?Nutzung: $0 <video.mp4>}"
OUT="$(cd "$(dirname "$0")/.." && pwd)/public/video/hero"
command -v ffmpeg >/dev/null || { echo "ffmpeg fehlt: brew install ffmpeg" >&2; exit 1; }

mkdir -p "$OUT"
rm -rf "$OUT"/360p "$OUT"/540p "$OUT"/720p "$OUT"/master.m3u8 "$OUT"/hero-720.mp4

# Der Rahmen auf der Seite ist max. 360 CSS-px breit (=720px auf Retina) → 720x1280 reicht, 1080p wäre Verschwendung.
# H.264 (überall abspielbar), Keyframe alle 2 s (Segmentgrenzen), 4-s-Segmente, Ton AAC.
for spec in "360p:360:640:600k:700k" "540p:540:960:1100k:1300k" "720p:720:1280:1900k:2200k"; do
  IFS=: read -r name w h br maxr <<<"$spec"
  mkdir -p "$OUT/$name"
  ffmpeg -y -loglevel error -i "$IN" \
    -vf "scale=$w:$h:force_original_aspect_ratio=increase,crop=$w:$h,fps=30" \
    -c:v libx264 -profile:v main -preset slow -crf 23 -b:v "$br" -maxrate "$maxr" -bufsize "$maxr" \
    -g 60 -keyint_min 60 -sc_threshold 0 -pix_fmt yuv420p \
    -c:a aac -b:a 96k -ac 2 \
    -f hls -hls_time 4 -hls_playlist_type vod -hls_flags independent_segments \
    -hls_segment_filename "$OUT/$name/seg_%03d.ts" "$OUT/$name/index.m3u8"
done

cat > "$OUT/master.m3u8" <<M3U
#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=360x640,CODECS="avc1.4d401e,mp4a.40.2"
360p/index.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=1400000,RESOLUTION=540x960,CODECS="avc1.4d401f,mp4a.40.2"
540p/index.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2300000,RESOLUTION=720x1280,CODECS="avc1.4d4020,mp4a.40.2"
720p/index.m3u8
M3U

# Fallback-MP4 mit faststart (spielt, bevor alles geladen ist)
ffmpeg -y -loglevel error -i "$IN" \
  -vf "scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,fps=30" \
  -c:v libx264 -profile:v main -preset slow -crf 25 -maxrate 1900k -bufsize 3800k -pix_fmt yuv420p \
  -c:a aac -b:a 96k -movflags +faststart "$OUT/hero-720.mp4"

# Poster: erstes Frame (leicht komprimiert)
ffmpeg -y -loglevel error -i "$IN" -frames:v 1 \
  -vf "scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280" -q:v 4 "$OUT/poster.jpg"

echo "Fertig:"; du -sh "$OUT" "$OUT"/*
