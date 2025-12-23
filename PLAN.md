# Plan: Enhanced Media Browser for custom-sonos-card

## Executive Summary

**Goal**: Integrate `ha-media-player-browse` from HA frontend into the existing `custom-sonos-card` repository.

**Verdict**: ✅ **This is the ideal approach** — the repo already has:
- Vite build system
- TypeScript configuration  
- HACS structure
- Media browser section (`mxmp-media-browser`)
- Same target audience (Sonos/media player users)

---

## ⚠️ Key Constraint: Monthly Updates

The HA frontend repo updates frequently (~monthly major changes). The architecture must support:
- Easy `git pull` or `git merge` from upstream
- Minimal manual conflict resolution
- Clear separation between upstream code and your code

### Current v10 Branch Structure

The `custom-sonos-card` v10 branch has this structure:

```
custom-sonos-card/ (v10 branch)
├── src/
│   ├── card.ts                    # Main card component
│   ├── main.ts                    # Entry point, registers custom elements
│   ├── constants.ts               # Constants and enums
│   ├── types.ts                   # TypeScript types (Section enum, CardConfig, etc.)
│   ├── components/                # Reusable UI components
│   │   ├── favorites-header.ts    # Header for favorites section
│   │   ├── favorites-icons.ts     # Grid view of favorites (icons)
│   │   ├── favorites-list.ts      # List view of favorites
│   │   ├── media-row.ts           # Media item row component
│   │   ├── player-controls.ts
│   │   └── ...
│   ├── sections/                  # Main card sections
│   │   ├── favorites.ts           # Current "media browser" (renamed from media-browser)
│   │   ├── player.ts
│   │   ├── groups.ts
│   │   ├── grouping.ts
│   │   ├── volumes.ts
│   │   └── queue.ts
│   ├── services/                  # API services
│   │   ├── media-browse-service.ts    # Uses hass.browseMedia() for favorites
│   │   ├── media-control-service.ts
│   │   └── hass-service.ts
│   ├── model/                     # Data models
│   ├── editor/                    # Card configuration editor
│   └── utils/                     # Utility functions
├── vite.config.mjs
├── package.json
└── hacs.json
```

**Key insight**: The `favorites` section (`sections/favorites.ts`) currently only shows the flat list of favorites. It does NOT support deep browsing (navigating into albums, playlists, etc.).

### Recommended Architecture: Upstream Folder

Add an `upstream/` folder for HA frontend code:

```
custom-sonos-card/
├── src/
│   ├── sections/
│   │   ├── favorites.ts           # Existing favorites (flat list)
│   │   ├── media-browser.ts       # NEW: wrapper for ha-media-player-browse
│   │   └── ...
│   ├── upstream/                  # SYNCED FROM HA FRONTEND (new!)
│   │   ├── ha-media-player-browse.ts
│   │   ├── data/
│   │   │   ├── media-player.ts
│   │   │   └── media-source.ts
│   │   └── common/
│   │       └── slugify.ts
│   └── types.ts                   # Add MEDIA_BROWSER to Section enum
├── scripts/
│   └── sync-upstream.sh
└── ...
```

### Integration Approach: Add New `MEDIA_BROWSER` Section

- Add `MEDIA_BROWSER` to `Section` enum in `types.ts`
- Create new `sections/media-browser.ts` that wraps `ha-media-player-browse`
- Add to card's section chooser in `card.ts`
- Pros: Full HA media browser features, coexists with existing favorites
- Cons: Different styling, may not match card aesthetic

### Available at Runtime (No Need to Bundle)

The Home Assistant frontend already provides **249+ `ha-*` components** at runtime. Based on `available_elements.json`, the following dependencies are **already available** and don't need bundling:

| Component | Status |
|-----------|--------|
| `ha-card` | ✅ Available |
| `ha-button` | ✅ Available |
| `ha-button-menu` | ✅ Available |
| `ha-icon-button` | ✅ Available |
| `ha-svg-icon` | ✅ Available |
| `ha-spinner` | ✅ Available |
| `ha-alert` | ✅ Available |
| `ha-list` | ✅ Available |
| `ha-list-item` | ✅ Available |
| `ha-fab` | ✅ Available |
| `ha-tooltip` | ✅ Available |
| `ha-entity-picker` | ✅ Available |
| `ha-form` | ✅ Available |
| `ha-textarea` | ✅ Available |
| `ha-media-player-browse` | ❌ **NOT available** (lazy-loaded) |

### ⚠️ Custom Element Registration Conflict

**Problem**: Custom elements can only be registered once. If we bundle `ha-media-player-browse` and register it with `customElements.define()`, but the HA frontend later tries to register the same name, we get:

```
DOMException: Failed to execute 'define' on 'CustomElementRegistry': 
the name "ha-media-player-browse" has already been defined
```

**Solution: Rename Component**

Modify the `@customElement()` decorator in our copy:

```typescript
// In src/upstream/ha-media-player-browse.ts
// Change FROM:
@customElement("ha-media-player-browse")

// Change TO:
@customElement("sonos-ha-media-player-browse")
```

This is handled automatically by the sync script (see Phase 3b).

Then use in wrapper:
```typescript
// In src/sections/media-browser.ts
html`<sonos-ha-media-player-browse ...></sonos-ha-media-player-browse>`
```

### What Actually Needs to Be Bundled

Only these files/functions need to be extracted:

#### 1. **Main Component** (~1,459 lines)
- `ha-media-player-browse.ts` → rename to `media-browser-card.ts`

#### 2. **Sub-components**
- ~~`ha-browse-media-manual.ts`~~ - **EXCLUDED** (Manual entry feature not needed)
- ~~`ha-browse-media-tts.ts`~~ - **EXCLUDED** (TTS feature not needed)

#### 3. **Data Layer** (~350 lines total)
- `data/media-player.ts` - Partial extraction:
  - `browseMediaPlayer()` function
  - `MediaPlayerItem` interface
  - `MediaClassBrowserSettings` constant
  - `BROWSER_PLAYER` constant
- `data/media_source.ts` (~71 lines):
  - `browseLocalMediaPlayer()` function
- ~~`data/tts.ts`~~ - **EXCLUDED** (TTS feature not needed)

#### 4. **Utilities** (~40 lines total)
- ~~`common/dom/fire_event.ts`~~ - **Use `custom-card-helpers`**: `import { fireEvent } from 'custom-card-helpers'`
- ~~`common/util/debounce.ts`~~ - **Use `custom-card-helpers`**: `import { debounce } from 'custom-card-helpers'`
- `common/string/slugify.ts` (~40 lines)

#### 5. **Excluded Features**
- ~~`ha-language-picker`~~ - **EXCLUDED** (TTS feature not needed)
- ~~`ha-tts-voice-picker`~~ - **EXCLUDED** (TTS feature not needed)
- ~~`ha-browse-media-tts`~~ - **EXCLUDED** (TTS feature not needed)

#### 6. **Styles** (extract relevant portions)
- `haStyle` from `resources/styles.ts`

---

## Estimated Bundle Size

| Category | Lines | Notes |
|----------|-------|-------|
| Main component | ~1,300 | Core media browser (with TTS/manual code stripped) |
| ~~Sub-components~~ | 0 | All excluded |
| Data layer | ~300 | Only needed functions |
| Utilities | ~40 | slugify only (fireEvent, debounce from custom-card-helpers) |
| Styles | ~50 | Extract only used styles |
| **Total** | **~1,690 lines** | Down from 34,000+ |

**Reduction: ~95%** of the original dependency tree eliminated.

---

## Implementation Plan

### Phase 1: Add Upstream Folder to custom-sonos-card

1. Create `src/upstream/` folder structure in custom-sonos-card repo
2. Create sync script: `scripts/sync-upstream.sh`
3. Add to `.gitignore` comment: `# upstream/ is synced from HA frontend`

No changes to existing build system needed — Vite will bundle the new files automatically.

### Phase 2: Extract Core Files (Keep Unchanged!)

1. Copy `ha-media-player-browse.ts` → **keep original name and code**
2. **Do NOT rename** the component - let it register as `ha-media-player-browse`
3. Only update import paths to work with new folder structure:
   ```typescript
   // Change fireEvent and debounce imports to use custom-card-helpers
   // FROM: import { fireEvent } from "../../common/dom/fire_event";
   // FROM: import { debounce } from "../../common/util/debounce";
   // TO:   import { fireEvent, debounce } from "custom-card-helpers";
   ```
4. The component can then be used directly in your existing components

### Phase 3: Extract Data Layer (Minimal Changes)

1. Copy files with minimal modification:
   - `data/media-player.ts` - Keep full file
   - `data/media_source.ts` - Keep full file  
2. Only change: Update import paths
3. Keep all functions even if unused (easier sync)

### Phase 3b: Create Sync Script

```bash
#!/bin/bash
# scripts/sync-upstream.sh
HA_FRONTEND_PATH="${1:-$HOME/code/frontend}"
UPSTREAM_DIR="src/upstream"

mkdir -p "$UPSTREAM_DIR/data" "$UPSTREAM_DIR/common"

# Files to sync
cp "$HA_FRONTEND_PATH/src/components/media-player/ha-media-player-browse.ts" "$UPSTREAM_DIR/"
cp "$HA_FRONTEND_PATH/src/data/media-player.ts" "$UPSTREAM_DIR/data/"
cp "$HA_FRONTEND_PATH/src/data/media_source.ts" "$UPSTREAM_DIR/data/"
cp "$HA_FRONTEND_PATH/src/common/string/slugify.ts" "$UPSTREAM_DIR/common/"

# Fix import paths (sed replacements)
find "$UPSTREAM_DIR" -name "*.ts" -exec sed -i '' \
  -e 's|from "../../common/dom/fire_event"|from "custom-card-helpers"|g' \
  -e 's|from "../../common/util/debounce"|from "custom-card-helpers"|g' \
  -e 's|from "../../common/|from "./common/|g' \
  -e 's|from "../../data/|from "./data/|g' \
  {} \;

# CRITICAL: Rename component to avoid registration conflicts with HA frontend
sed -i '' 's/@customElement("ha-media-player-browse")/@customElement("sonos-ha-media-player-browse")/g' \
  "$UPSTREAM_DIR/ha-media-player-browse.ts"

echo "Synced from $HA_FRONTEND_PATH"
echo "Component renamed to 'sonos-ha-media-player-browse' to avoid conflicts"
echo "Run 'npm run build' to check for breaking changes"
```

### Phase 4: Integrate with Card

**Recommended: Add as new MEDIA_BROWSER section**

#### Step 4a: Update types.ts

Add `MEDIA_BROWSER` to the Section enum:

```typescript
// In src/types.ts
export enum Section {
  FAVORITES = 'favorites',
  GROUPS = 'groups',
  PLAYER = 'player',
  GROUPING = 'grouping',
  VOLUMES = 'volumes',
  QUEUE = 'queue',
  MEDIA_BROWSER = 'media-browser',  // NEW
}
```

#### Step 4b: Create new section wrapper

Create `src/sections/media-browser.ts`:

```typescript
import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
import '../upstream/ha-media-player-browse';  // Registers as 'sonos-ha-media-player-browse'
import Store from '../model/store';
import { MEDIA_ITEM_SELECTED } from '../constants';
import { customEvent } from '../utils/utils';

export class MediaBrowser extends LitElement {
  @property({ attribute: false }) store!: Store;

  render() {
    return html`
      <style>
        /* Hide TTS and manual entry panels if present */
        ha-browse-media-tts,
        ha-browse-media-manual { display: none !important; }
      </style>
      <sonos-ha-media-player-browse
        .hass=${this.store.hass}
        .entityId=${this.store.activePlayer?.id}
        .action=${'play'}
        @media-picked=${this._handleMediaPicked}
      ></sonos-ha-media-player-browse>
    `;
  }

  private _handleMediaPicked(ev: CustomEvent) {
    const { item } = ev.detail;
    if (item.can_play) {
      this.store.mediaControlService.playMedia(this.store.activePlayer, item);
      this.dispatchEvent(customEvent(MEDIA_ITEM_SELECTED, item));
    }
  }

  static styles = css`
    :host {
      display: block;
      height: 100%;
    }
    sonos-ha-media-player-browse {
      --media-browse-item-size: 80px;
      height: 100%;
    }
  `;
}

customElements.define('sonos-media-browser', MediaBrowser);
```

#### Step 4c: Update card.ts

Add the new section to the choose() directive:

```typescript
// In src/card.ts, add import at top:
import './sections/media-browser';

// Add to the Section destructuring:
const { GROUPING, GROUPS, FAVORITES, PLAYER, VOLUMES, QUEUE, MEDIA_BROWSER } = Section;

// Add to the choose() array in render():
[
  MEDIA_BROWSER,
  () => html`<sonos-media-browser
    .store=${this.store}
    @item-selected=${this.onMediaItemSelected}
  ></sonos-media-browser>`,
],
```

#### Step 4d: Update constants.ts (optional)

Add icon for new section button if desired:
```typescript
// sectionButtonIcons default could include:
// mediaBrowser: 'mdi:folder-music'
```

### Phase 5: Hide Unwanted Features (Already Done in Wrapper!)

The TTS and manual entry panels are hidden via CSS in the wrapper component (see Phase 4b).

**Benefits:**
- Upstream code stays unmodified → easy monthly sync
- No merge conflicts on TTS/manual code
- Features can be re-enabled later if needed

### Phase 6: Testing & Release

1. Test with existing Sonos card functionality
2. Verify media browsing works with Sonos, Spotify, local media
3. Release as part of regular custom-sonos-card update
4. **Monthly**: Run `scripts/sync-upstream.sh`, rebuild, test

### Monthly Update Workflow

```bash
cd custom-sonos-card
./scripts/sync-upstream.sh ~/code/frontend
npm run build
npm test
git commit -am "chore: sync upstream from HA frontend $(date +%Y-%m)"
```

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| HA frontend API changes | Components stop working | Sync script + build check catches early |
| Breaking import changes | Build fails after sync | Automated path-fixing in sync script |
| Missing runtime components | Card fails to render | Check `customElements.get()` before use |
| ~~TTS picker complexity~~ | ~~N/A~~ | TTS hidden via CSS, not removed |
| Virtualizer dependency | Bundle size increase | @lit-labs/virtualizer is small (~15KB) |
| Monthly sync conflicts | Manual resolution needed | Keep upstream code unmodified → no conflicts |

---

## Alternative Approaches Considered

### ❌ Fork Entire Frontend
- **Pros**: Easy to start
- **Cons**: 34K+ lines, massive maintenance burden, diverges quickly

### ❌ Use Dialog Instead of Card
- **Pros**: `showMediaBrowserDialog()` already exists
- **Cons**: Not a card, can't be placed on dashboards

### ✅ Extract Minimal Code (Recommended)
- **Pros**: Small bundle, maintainable, clear dependencies
- **Cons**: Some manual work to extract and adapt

---

## Next Steps

1. [ ] Create `src/upstream/` folder in custom-sonos-card (v10 branch)
2. [ ] Create `scripts/sync-upstream.sh`
3. [ ] Run initial sync from HA frontend
4. [ ] Fix import paths in synced files
5. [ ] Add `MEDIA_BROWSER` to `Section` enum in `src/types.ts`
6. [ ] Create `src/sections/media-browser.ts` wrapper component
7. [ ] Update `src/card.ts` to include new section in `choose()`
8. [ ] Add section button icon (optional)
9. [ ] Test with Sonos players
10. [ ] Release as part of custom-sonos-card
11. [ ] **Monthly**: Run sync script, rebuild, test

---

## Quick Start Commands

```bash
cd ~/code/custom-sonos-card

# Create upstream folder structure
mkdir -p src/upstream/data src/upstream/common

# Create and run sync script
cat > scripts/sync-upstream.sh << 'EOF'
#!/bin/bash
HA_FRONTEND_PATH="${1:-$HOME/code/frontend}"
# ... (script content from Phase 3b)
EOF
chmod +x scripts/sync-upstream.sh

# Run initial sync
./scripts/sync-upstream.sh ~/code/frontend

# Build and test
npm run build
```

---

## Conclusion

This approach is **ideal** because:

1. **No new repo needed** — integrates into existing custom-sonos-card (v10 branch)
2. **Existing build system** — Vite already configured
3. **Existing HACS presence** — already in HACS default
4. **Same audience** — Sonos users already want media browsing
5. **Coexists with Favorites** — new `MEDIA_BROWSER` section alongside existing `FAVORITES` section
6. **Monthly sync** — upstream folder stays unchanged, easy to update

**Key v10 structure points:**
- Current sections: `FAVORITES`, `GROUPS`, `PLAYER`, `GROUPING`, `VOLUMES`, `QUEUE`
- New section: `MEDIA_BROWSER` (uses `ha-media-player-browse` for deep browsing)
- Favorites section remains for flat list of favorites with custom thumbnails, topItems, etc.
- Media Browser section provides full hierarchical browsing (Spotify playlists, local media, etc.)

**Monthly update workflow:**
```bash
./scripts/sync-upstream.sh ~/code/frontend
npm run build
npm test
git commit -am "chore: sync upstream from HA frontend $(date +%Y-%m)"
```

This results in a maintainable enhancement that can track upstream changes with minimal effort.
