#!/usr/bin/env bash
# Regenerates the PNG icons in web_app/public from the SVG sources here (needs rsvg-convert).
# public/favicon.svg stays the browser-tab icon; these cover iOS home screen and installed PWAs.
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
out="$here/../../public"
rsvg-convert -w 180 -h 180 "$here/icon-full.svg" -o "$out/apple-touch-icon.png"
rsvg-convert -w 192 -h 192 "$out/favicon.svg" -o "$out/icon-192.png"
rsvg-convert -w 512 -h 512 "$out/favicon.svg" -o "$out/icon-512.png"
rsvg-convert -w 512 -h 512 "$here/icon-maskable.svg" -o "$out/icon-maskable-512.png"
