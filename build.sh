#!/bin/sh
# Packages extension/ into dist/yc-deadline-countdown.zip for "Load unpacked".
set -e
cd "$(dirname "$0")"
rm -rf dist && mkdir -p dist/yc-deadline-countdown
cp -R extension/ dist/yc-deadline-countdown/
(cd dist && zip -qrX yc-deadline-countdown.zip yc-deadline-countdown -x '*.DS_Store')
rm -rf dist/yc-deadline-countdown
echo "Built dist/yc-deadline-countdown.zip"
