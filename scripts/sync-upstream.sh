#!/bin/bash
# Sync upstream files from Home Assistant frontend using patch-based approach
# Usage: ./scripts/sync-upstream.sh [release-tag]
# Example: ./scripts/sync-upstream.sh 20251203.3

set -e

HA_FRONTEND_REPO="https://raw.githubusercontent.com/home-assistant/frontend"
UPSTREAM_DIR="src/upstream"
PATCHES_DIR="patches"
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
mkdir -p "$UPSTREAM_DIR/data" "$UPSTREAM_DIR/common" "$UPSTREAM_DIR/resources"

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
echo "Applying patch to ha-media-player-browse.ts..."
if patch -p0 --forward --reject-file=- "$UPSTREAM_DIR/ha-media-player-browse.ts" < "$PATCHES_DIR/ha-media-player-browse.patch"; then
    echo "  ✅ Patch applied successfully"
else
    echo ""
    echo "  ⚠️  Patch failed or had conflicts!"
    echo "  The upstream file may have changed significantly."
    echo ""
    echo "  Options:"
    echo "  1. Manually resolve conflicts in $UPSTREAM_DIR/ha-media-player-browse.ts"
    echo "  2. After fixing, regenerate patch with:"
    echo "     curl -sf '$HA_FRONTEND_REPO/$RELEASE_TAG/src/components/media-player/ha-media-player-browse.ts' -o /tmp/upstream.ts"
    echo "     diff -u /tmp/upstream.ts $UPSTREAM_DIR/ha-media-player-browse.ts > $PATCHES_DIR/ha-media-player-browse.patch"
    echo ""
    exit 1
fi

# Fix import paths for other files (simple replacements)
echo ""
echo "Fixing import paths in data files..."
find "$UPSTREAM_DIR/data" -name "*.ts" -exec sed -i '' \
  -e 's|from "../../common/dom/fire_event"|from "custom-card-helpers"|g' \
  -e 's|from "../../common/util/debounce"|from "custom-card-helpers"|g' \
  -e 's|from "../common/|from "./common/|g' \
  -e 's|from "./common/entity/supports-feature"|from "./supports-feature"|g' \
  -e 's|from "./common/entity/state_active"|from "./state_active"|g' \
  {} \;

# Create stub for state_active (not in custom-card-helpers)
echo "Creating state_active stub..."
cat > "$UPSTREAM_DIR/data/state_active.ts" << 'EOF'
// @ts-nocheck
// Stub for state_active - simplified version
import type { HassEntity } from 'home-assistant-js-websocket';

export const stateActive = (stateObj: HassEntity): boolean => {
  const state = stateObj.state;
  return state !== 'unavailable' && state !== 'unknown' && state !== 'off';
};
EOF

# Create stub for supportsFeature
echo "Creating supportsFeature stub..."
cat > "$UPSTREAM_DIR/data/supports-feature.ts" << 'EOF'
// @ts-nocheck
// Stub for supportsFeature
import type { HassEntity } from 'home-assistant-js-websocket';

export const supportsFeature = (stateObj: HassEntity, feature: number): boolean => {
  return (stateObj.attributes.supported_features! & feature) !== 0;
};
EOF

# Add @ts-nocheck to data files
echo "Adding @ts-nocheck to data files..."
for file in "$UPSTREAM_DIR/data"/*.ts "$UPSTREAM_DIR/common"/*.ts; do
  if [ -f "$file" ]; then
    # Check if already has @ts-nocheck
    if ! grep -q "^// @ts-nocheck" "$file"; then
      sed -i '' '1s/^/\/\/ @ts-nocheck\n/' "$file"
    fi
  fi
done

# Update virtualizer.ts
echo "Updating virtualizer.ts..."
cat > "$UPSTREAM_DIR/resources/virtualizer.ts" << 'EOF'
// @ts-nocheck
import { LitVirtualizer } from '@lit-labs/virtualizer/LitVirtualizer.js';

// Only register if not already defined (HA might have it already)
if (!customElements.get('lit-virtualizer')) {
    customElements.define('lit-virtualizer', LitVirtualizer);
}

export const loadVirtualizer = async (): Promise<void> => {
    // Element is registered above via static import
};
EOF

# Save version info
echo "$RELEASE_TAG" > "$VERSION_FILE"
echo "Synced: $(date -u +"%Y-%m-%d %H:%M:%S UTC")" >> "$VERSION_FILE"

echo ""
echo "✅ Synced from HA frontend release: $RELEASE_TAG"
echo "✅ Patch applied to ha-media-player-browse.ts"
echo "✅ Version saved to $VERSION_FILE"
echo ""
echo "Next: Run 'npm run build' to verify"
