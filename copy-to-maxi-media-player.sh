#!/usr/bin/env bash
rsync -av --exclude='*.DS_Store' --exclude='coverage' --exclude='node_modules' --exclude='.git' --exclude='.idea' --exclude='dist' . ../maxi-media-player

find ../maxi-media-player -name "*" \
  -not -path "*/.idea/*" \
  -not -path "*/.git/*" \
  -not -path "*/node_modules/*" \
  -not -path "*/coverage/*" -type f \
  -exec gsed -i '/\/\/#ONLY_SONOS_CARD_START/,/\/\/#ONLY_SONOS_CARD_END/d' {} \; \
  -exec perl -i -pe 's/.*#ONLY_SONOS_CARD.*\n//' {} \; \
  -exec sed -i '' -e "s/'sonos-card'/'maxi-media-player'/g" {} \; \
  -exec sed -i '' -e "s/'Sonos'/'Maxi Media Player'/g" {} \; \
  -exec sed -i '' -e 's/custom-sonos-card/maxi-media-player/g' {} \; \
  -exec sed -i '' -e 's/custom:sonos-card/custom:maxi-media-player/g' {} \; \
  -exec sed -i '' -e 's/raw\/master/raw\/main/g' {} \; \
  -exec sed -i '' -e 's/sonos-card-/mxmp-/g' {} \; \
  -exec sed -i '' -e 's/sonos-/mxmp-/g' {} \; \
  -exec sed -i '' -e 's/sonos-card-dispatch/mxmp-dispatch/g' {} \; \
  -exec sed -i '' -e 's/Sonos Card/Maxi Media Player/g' {} \; \
  -exec sed -i '' -e 's/Media player for your Sonos speakers/Media card for Home Assistant UI with a focus on managing multiple media players/g' {} \;
