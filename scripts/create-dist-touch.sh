#!/usr/bin/env bash
# Builds a renamed copy of the card (custom:sonos-touch-card) that can be installed next to the
# regular sonos-card from HACS, to try the touch-optimised media browser on a test dashboard.
set -euo pipefail
DIR="dist-touch"
FILE="sonos-touch-card.js"
mkdir -p "$DIR"
cp dist/custom-sonos-card.js "$DIR/$FILE"
sed -i \
  -e 's/sonos-font-size/__SONOS_FONT_SIZE__/g' \
  -e 's/sonos-/sonos-touch-/g' \
  -e 's/__SONOS_FONT_SIZE__/sonos-font-size/g' \
  -e 's/name: "Sonos"/name: "Sonos (touch)"/g' \
  -e "s/name: 'Sonos'/name: 'Sonos (touch)'/g" \
  "$DIR/$FILE"
echo "Built $DIR/$FILE"
