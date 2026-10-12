#!/bin/sh
# Packages extension/ into dist/lofi-deadline-countdown.zip, ready for
# chrome://extensions -> "Load unpacked".
set -e
cd "$(dirname "$0")"
NAME=lofi-deadline-countdown
rm -rf dist && mkdir -p "dist/$NAME"
cp -R extension/ "dist/$NAME/"
(cd dist && zip -qrX "$NAME.zip" "$NAME" -x '*.DS_Store')
rm -rf "dist/$NAME"
echo "Built dist/$NAME.zip"
