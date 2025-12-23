#!/bin/bash
# Sync upstream files from Home Assistant frontend
# Usage: ./scripts/sync-upstream.sh [release-tag]
# Example: ./scripts/sync-upstream.sh 20251203.3

set -e

HA_FRONTEND_REPO="https://raw.githubusercontent.com/home-assistant/frontend"
UPSTREAM_DIR="src/upstream"
VERSION_FILE="$UPSTREAM_DIR/.upstream-version"

# Get release tag (default to latest if not specified)
if [ -n "$1" ]; then
    RELEASE_TAG="$1"
else
    echo "Fetching latest release tag..."
    RELEASE_TAG=$(curl -s "https://api.github.com/repos/home-assistant/frontend/releases/latest" | grep '"tag_name"' | sed -E 's/.*"([^"]+)".*/\1/')
    if [ -z "$RELEASE_TAG" ]; then
        echo "Error: Could not fetch latest release tag"
        exit 1
    fi
fi

echo "Syncing from Home Assistant frontend release: $RELEASE_TAG"
echo ""

# Create directories
mkdir -p "$UPSTREAM_DIR/data" "$UPSTREAM_DIR/common"

# Function to download a file
download_file() {
    local src_path="$1"
    local dest_path="$2"
    local url="$HA_FRONTEND_REPO/$RELEASE_TAG/src/$src_path"
    
    echo "  Downloading: $src_path"
    if ! curl -sf "$url" -o "$dest_path"; then
        echo "  Error: Failed to download $src_path"
        return 1
    fi
}

echo "Downloading files..."
download_file "components/media-player/ha-media-player-browse.ts" "$UPSTREAM_DIR/ha-media-player-browse.ts"
download_file "data/media-player.ts" "$UPSTREAM_DIR/data/media-player.ts"
download_file "data/media_source.ts" "$UPSTREAM_DIR/data/media_source.ts"
download_file "common/string/slugify.ts" "$UPSTREAM_DIR/common/slugify.ts"

echo ""
echo "Fixing import paths..."

# Fix import paths (sed replacements)
find "$UPSTREAM_DIR" -name "*.ts" -exec sed -i '' \
  -e 's|from "../../common/dom/fire_event"|from "custom-card-helpers"|g' \
  -e 's|from "../../common/util/debounce"|from "custom-card-helpers"|g' \
  -e 's|from "../../common/|from "./common/|g' \
  -e 's|from "../../data/|from "./data/|g' \
  -e 's|from "../components/|from "./|g' \
  {} \;

# Fix imports in ha-media-player-browse.ts specifically
sed -i '' \
  -e 's|from "\.\./\.\./types"|from "../../types"|g' \
  "$UPSTREAM_DIR/ha-media-player-browse.ts"

# CRITICAL: Rename component to avoid registration conflicts with HA frontend
echo "Renaming component to avoid conflicts..."
sed -i '' 's/@customElement("ha-media-player-browse")/@customElement("sonos-ha-media-player-browse")/g' \
  "$UPSTREAM_DIR/ha-media-player-browse.ts"

# Apply Sonos Card customizations to grid layout
echo "Applying Sonos Card grid customizations..."
# Change grid item size from 175px to 100px for compact display (4 columns instead of 2)
sed -i '' \
  -e "s/width: '175px'/width: '100px'/g" \
  -e "s/height: '312px'/height: '180px'/g" \
  -e "s/height: '225px'/height: '150px'/g" \
  -e "s/gap: '16px'/gap: '8px'/g" \
  "$UPSTREAM_DIR/ha-media-player-browse.ts"

# Reduce play button size for smaller grid items
echo "Reducing play button size..."
sed -i '' \
  -e 's/--mdc-icon-button-size: 70px/--mdc-icon-button-size: 40px/g' \
  -e 's/--mdc-icon-size: 48px/--mdc-icon-size: 24px/g' \
  -e 's/top: calc(50% - 40px)/top: calc(50% - 20px)/g' \
  -e 's/right: calc(50% - 35px)/right: calc(50% - 20px)/g' \
  "$UPSTREAM_DIR/ha-media-player-browse.ts"

# Save version info
echo "$RELEASE_TAG" > "$VERSION_FILE"
echo "Synced: $(date -u +"%Y-%m-%d %H:%M:%S UTC")" >> "$VERSION_FILE"

echo ""
echo "✅ Synced from HA frontend release: $RELEASE_TAG"
echo "✅ Component renamed to 'sonos-ha-media-player-browse'"
echo "✅ Grid customizations applied (100px items, 8px gap)"
echo "✅ Version saved to $VERSION_FILE"
echo ""
echo "Next: Run 'npm run build' to check for breaking changes"
