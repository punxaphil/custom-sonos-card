# Breaking Changes

## Release v10

This release includes a major refactoring to use **nested YAML configuration**. Section-specific options are now organized under their respective section keys for a cleaner, more intuitive configuration structure.

### ⚠️ Configuration Migration Required

All section-specific configuration options now live under nested section keys (`player`, `favorites`, `groups`, `grouping`, `volumes`, `queue`).

### Quick Migration Guide

If your card stopped working after upgrading to v10, follow these steps:

#### Step 1: Identify prefixed options

Look for any options in your config that start with these prefixes:
- `player...` → move under `player:`
- `mediaBrowser...` → rename to remove prefix and move under `favorites:`
- `favorites...` → move under `favorites:`
- `groups...` → move under `groups:`
- `grouping...` → move under `grouping:`
- `volumes...` → move under `volumes:`
- `queue...` → move under `queue:`

#### Step 2: Remove the prefix and nest under the section

For each prefixed option:
1. Remove the section prefix (e.g., `playerHideArtwork` → `hideArtwork`)
2. Move it under the appropriate section key

#### Step 3: Rename mediaBrowser to favorites

If you used `mediaBrowser...` options, rename them to use `favorites` instead.

#### Migration Examples

**Volume controls not showing?**
```yaml
# Before (v9)
playerHideVolume: false
playerShowVolumeUpAndDownButtons: true

# After (v10)
player:
  hideVolume: false
  showVolumeUpAndDownButtons: true
```

**Favorites/Media Browser missing?**
```yaml
# Before (v9)
mediaBrowserItemsPerRow: 3
mediaBrowserHideTitleForThumbnailIcons: true
favoritesTopItems:
  - My Playlist

# After (v10)
favorites:
  itemsPerRow: 3
  hideTitleForThumbnailIcons: true
  topItems:
    - My Playlist
```

**Groups section broken?**
```yaml
# Before (v9)
groupsTitle: My Speakers
groupsCompact: true

# After (v10)
groups:
  title: My Speakers
  compact: true
```

**Grouping section broken?**
```yaml
# Before (v9)
groupingButtonColor: "#ff0000"
groupingCompact: true

# After (v10)
grouping:
  buttonColor: "#ff0000"
  compact: true
```

#### Options that stay at root level

These options do NOT need to be nested (they affect multiple sections):
- `entities`, `entityId`, `entityPlatform`
- `predefinedGroups`
- `sections`, `startSection`
- `title`, `baseFontSize`, `heightPercentage`, `widthPercentage`
- `volumeStepSize`, `dynamicVolumeSlider`, `changeVolumeOnSlide`
- All `entityName...` and `mediaTitle...` regex options

See the full list in "Cross-Section Options" below.

#### Media Browser → Favorites (Section Rename)

The "Media Browser" section has been renamed to "Favorites" throughout the codebase and configuration.

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
favorites:
  topItems:
    - My Playlist
    - Radio Station
```

### Section Configuration Reference

#### Player Section (`player:`)

| Property | Description |
|----------|-------------|
| `artworkAsBackground` | Use artwork as background |
| `artworkAsBackgroundBlur` | Blur amount for artwork background |
| `artworkHostname` | Override hostname for artwork URLs |
| `artworkMinHeight` | Minimum height of artwork (rem) |
| `backgroundOverlayColor` | Background overlay color (e.g., `rgba(0,0,0,0.3)`) |
| `controlsAndHeaderBackgroundOpacity` | Opacity for controls and header background |
| `controlsColor` | Color for control icons |
| `controlsLargeIcons` | Use large control icons |
| `controlsMargin` | Margin around controls |
| `fallbackArtwork` | Fallback artwork URL |
| `fastForwardAndRewindStepSizeSeconds` | Step size for fast forward/rewind |
| `headerEntityFontSize` | Font size for entity name |
| `headerSongFontSize` | Font size for song title |
| `hideArtistAlbum` | Hide artist and album |
| `hideArtwork` | Hide artwork |
| `hideControls` | Hide all controls |
| `hideControlNextTrackButton` | Hide next track button |
| `hideControlPowerButton` | Hide power button |
| `hideControlPrevTrackButton` | Hide previous track button |
| `hideControlRepeatButton` | Hide repeat button |
| `hideControlShuffleButton` | Hide shuffle button |
| `hideEntityName` | Hide entity name |
| `hideHeader` | Hide player header |
| `hidePlaylist` | Hide playlist |
| `hideVolume` | Hide volume control |
| `hideVolumeMuteButton` | Hide mute button |
| `hideVolumePercentage` | Hide volume percentage |
| `labelWhenNoMediaIsSelected` | Label when no media is playing |
| `mediaArtworkOverrides` | Array of artwork override rules |
| `showAudioInputFormat` | Show audio input format |
| `showBrowseMediaButton` | Show browse media button |
| `showChannel` | Show channel |
| `showFastForwardAndRewindButtons` | Show fast forward/rewind buttons |
| `showSource` | Show source |
| `showVolumeUpAndDownButtons` | Show volume up/down buttons |
| `stopInsteadOfPause` | Stop instead of pause |
| `volumeEntityId` | Entity ID for volume control |
| `volumeMuteButtonSize` | Size of mute button (rem) |
| `volumeSliderHeight` | Height of volume slider (rem) |

#### Favorites Section (`favorites:`)

| Property | Description |
|----------|-------------|
| `customFavorites` | Custom favorites configuration |
| `customThumbnails` | Custom thumbnail URLs |
| `customThumbnailsIfMissing` | Custom thumbnails when missing |
| `hideBrowseMediaButton` | Hide browse media button |
| `hideHeader` | Hide favorites header |
| `hideTitleForThumbnailIcons` | Hide titles for thumbnail icons |
| `iconBorder` | Border for icons (e.g., `1px solid white`) |
| `iconPadding` | Padding around icons (rem) |
| `iconTitleBackgroundColor` | Background color for icon titles |
| `iconTitleColor` | Color for icon titles |
| `itemsPerRow` | Number of items per row |
| `numberToShow` | Number of favorites to show |
| `replaceHttpWithHttpsForThumbnails` | Replace HTTP with HTTPS |
| `sortByType` | Sort favorites by type |
| `title` | Custom title for section |
| `exclude` | Array of favorites to exclude (matched against title and media_content_id) |
| `topItems` | Array of favorites to show first |

#### Groups Section (`groups:`)

| Property | Description |
|----------|-------------|
| `buttonWidth` | Width of group buttons (rem) |
| `compact` | Compact mode |
| `hideCurrentTrack` | Hide current track info |
| `itemMargin` | Margin around items |
| `title` | Custom title for section |

#### Grouping Section (`grouping:`)

| Property | Description |
|----------|-------------|
| `buttonColor` | Button background color |
| `buttonFontSize` | Button font size (rem) |
| `buttonIcons` | Custom button icons |
| `compact` | Compact mode |
| `disableMainSpeakers` | Disable main speakers |
| `dontSortMembersOnTop` | Don't sort members on top |
| `dontSwitchPlayer` | Don't switch player when grouping |
| `hideUngroupAllButtons` | Hide ungroup all buttons |
| `skipApplyButton` | Skip apply button |
| `title` | Custom title for section |

#### Volumes Section (`volumes:`)

| Property | Description |
|----------|-------------|
| `hideCogwheel` | Hide cogwheel button |
| `labelForAllSlider` | Label for "all" volume slider |
| `title` | Custom title for section |

#### Queue Section (`queue:`) - Sonos Card only

| Property | Description |
|----------|-------------|
| `itemBackgroundColor` | Background color for queue items |
| `itemTextColor` | Text color for queue items |
| `title` | Custom title for section |

### Cross-Section Options (Root Level)

These options remain at the root level as they affect multiple sections:

| Property | Description |
|----------|-------------|
| `adjustVolumeRelativeToMainPlayer` | Adjust volume relative to main player |
| `allowPlayerVolumeEntityOutsideOfGroup` | Allow volume entity outside of group |
| `baseFontSize` | Base font size (rem) |
| `changeVolumeOnSlide` | Change volume while sliding |
| `doNotRememberSelectedPlayer` | Don't remember selected player |
| `dynamicVolumeSlider` | Enable dynamic volume slider |
| `dynamicVolumeSliderMax` | Maximum for dynamic slider |
| `dynamicVolumeSliderThreshold` | Threshold for dynamic slider |
| `entities` | Array of entity IDs |
| `entitiesToIgnoreVolumeLevelFor` | Entities to ignore volume level for |
| `entityId` | Force selected entity |
| `entityNameRegexToReplace` | Regex for entity name replacement |
| `entityNameReplacement` | Replacement for entity name |
| `entityPlatform` | Entity platform filter |
| `excludeItemsInEntitiesList` | Exclude items in entities list |
| `footerHeight` | Footer height |
| `heightPercentage` | Height percentage |
| `inverseGroupMuteState` | Inverse group mute state |
| `mediaTitleRegexToReplace` | Regex for media title replacement |
| `mediaTitleReplacement` | Replacement for media title |
| `minWidth` | Minimum width (rem) |
| `predefinedGroups` | Array of predefined groups |
| `sectionButtonIconSize` | Section button icon size |
| `sectionButtonIcons` | Custom section button icons |
| `sections` | Array of sections to show |
| `showNonSonosPlayers` | Show non-Sonos players |
| `startSection` | Section to show on start |
| `storePlayerInSessionStorage` | Store player in session storage |
| `title` | Card title |
| `volumeStepSize` | Volume step size |
| `widthPercentage` | Width percentage |
