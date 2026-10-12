#!/bin/sh
# Packages extension/ into dist/lofi-deadline-countdown.zip, ready for
# chrome://extensions -> "Load unpacked".
set -e
cd "$(dirname "$0")"
NAME=lofi-deadline-countdown
rm -rf dist && mkdir -p "dist/$NAME"
# "extension/." copies the contents on both macOS and Linux (GNU cp would
# nest the directory itself given "extension/").
cp -R extension/. "dist/$NAME/"
(cd dist && zip -qrX "$NAME.zip" "$NAME" -x '*.DS_Store')
rm -rf "dist/$NAME"
echo "Built dist/$NAME.zip"
