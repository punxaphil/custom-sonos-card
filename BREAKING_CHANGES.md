# Breaking Changes

## Release v10

This release includes major changes:

1. **Nested YAML configuration** - Section-specific options are now organized under their respective section keys
2. **New Media Browser section** - Browse media and favorites in a unified interface. 

### ⚠️ Configuration Migration Required

All section-specific configuration options now live under nested section keys (`player`, `mediaBrowser`, `groups`, `grouping`, `volumes`, `queue`).

### Quick Migration Guide

#### Removed deprecated options

These options no longer exist:
- `hideBrowseMediaButton` - removed (browse media is now integrated)

### New Nested Structure

Instead of flat configuration with prefixes, options are now organized under their section:

**Before (v9):**
```yaml
type: custom:sonos-card
playerArtworkAsBackground: true
playerArtworkMinHeight: 10
playerHideArtwork: false
groupsCompact: true
favoritesTopItems:
  - My Playlist
  - Radio Station
```

**After (v10):**
```yaml
type: custom:sonos-card
player:
  artworkAsBackground: true
  artworkMinHeight: 10
  hideArtwork: false
groups:
  compact: true
mediaBrowser:
  favorites:
    topItems:
      - My Playlist
      - Radio Station
```

### Section Configuration Reference

See Readme for full details on each section's configuration options:
[Config Section](./README.md#Configuration)
