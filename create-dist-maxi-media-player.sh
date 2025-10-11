#!/usr/bin/env bash
shopt -s expand_aliases # Use aliases in script

DIR="dist-maxi-media-player"
FILE="maxi-media-player.js"
mkdir -p $DIR

# Use gsed on Mac
if [[ "$OSTYPE" == "darwin"* ]]; then
  alias sed=gsed
fi
cp dist/custom-sonos-card.js $DIR/$FILE
cd $DIR || exit
sed -i 's/"sonos-card"/"maxi-media-player"/g' $FILE
sed -i 's/"Sonos"/"Maxi Media Player"/g' $FILE
sed -i 's/sonos-card-/mxmp-/g' $FILE
sed -i 's/sonos-/mxmp-/g' $FILE
sed -i 's/sonos-card-dispatch/mxmp-dispatch/g' $FILE
sed -i 's/Sonos Card/Maxi Media Player/g' $FILE
sed -i 's/Media player for your Sonos speakers/Media card for Home Assistant UI with a focus on managing multiple media players/g' $FILE

FILE="README.md"
cd ..
cp $FILE $DIR/
cd $DIR || exit
sed -i '/\/\/#ONLY_SONOS_CARD_START/,/\/\/#ONLY_SONOS_CARD_END/d' $FILE
sed -i ':a;N;$!ba;s/[^\n]*#ONLY_SONOS_CARD[^\n]*\n//g' $FILE
sed -i '/NO_REPLACE_ON_THIS_LINE/!s/custom-sonos-card/maxi-media-player/g' $FILE
sed -i '/NO_REPLACE_ON_THIS_LINE/!s/custom:sonos-card/custom:maxi-media-player/g' $FILE
sed -i '/NO_REPLACE_ON_THIS_LINE/!s/Sonos Card/Maxi Media Player/g' $FILE
sed -i '/NO_REPLACE_ON_THIS_LINE/!s/sonos-/mxmp-/g' $FILE
sed -i 's/#NO_REPLACE_ON_THIS_LINE//g' $FILE
