# Breaking Changes

## Release v10

This release includes a major refactoring of configuration property names to improve consistency and organization. All section-specific configuration options now use a consistent naming convention with section prefixes.

### ⚠️ Configuration Migration Required

If you have existing card configurations, you will need to update the following property names:

#### Media Browser → Favorites (Section Rename)

The "Media Browser" section has been renamed to "Favorites" throughout the codebase and configuration.

#### Player Section

| Old Name | New Name |
|----------|----------|
| `hidePlayerArtwork` | `playerHideArtwork` |
| `artworkMinHeight` | `playerArtworkMinHeight` |
| `artworkAsBackground` | `playerArtworkAsBackground` |
| `artworkAsBackgroundBlur` | `playerArtworkAsBackgroundBlur` |
| `artworkHostname` | `playerArtworkHostname` |
| `fallbackArtwork` | `playerFallbackArtwork` |
| `mediaArtworkOverrides` | `playerMediaArtworkOverrides` |
| `labelWhenNoMediaIsSelected` | `playerLabelWhenNoMediaIsSelected` |
| `showVolumeUpAndDownButtons` | `playerShowVolumeUpAndDownButtons` |
| `showFastForwardAndRewindButtons` | `playerShowFastForwardAndRewindButtons` |
| `fastForwardAndRewindStepSizeSeconds` | `playerFastForwardAndRewindStepSizeSeconds` |
| `showAudioInputFormat` | `playerShowAudioInputFormat` |
| `showSourceInPlayer` | `playerShowSource` |
| `showChannelInPlayer` | `playerShowChannel` |
| `showBrowseMediaInPlayerSection` | `playerShowBrowseMediaButton` |
| `stopInsteadOfPause` | `playerStopInsteadOfPause` |

#### Favorites Section

| Old Name | New Name |
|----------|----------|
| `customFavorites` | `favoritesCustomFavorites` |
| `customFavoriteThumbnails` | `favoritesCustomThumbnails` |
| `customFavoriteThumbnailsIfMissing` | `favoritesCustomThumbnailsIfMissing` |
| `topFavorites` | `favoritesTopItems` |
| `numberOfFavoritesToShow` | `favoritesNumberToShow` |
| `sortFavoritesByType` | `favoritesSortByType` |
| `replaceHttpWithHttpsForThumbnails` | `favoritesReplaceHttpWithHttpsForThumbnails` |

#### Groups Section

| Old Name | New Name |
|----------|----------|
| `compactGroups` | `groupsCompact` |
| `groupButtonWidth` | `groupsButtonWidth` |

#### Grouping Section

| Old Name | New Name |
|----------|----------|
| `compactGrouping` | `groupingCompact` |
| `skipApplyButtonWhenGrouping` | `groupingSkipApplyButton` |
| `dontSwitchPlayerWhenGrouping` | `groupingDontSwitchPlayer` |

#### Volumes Section

| Old Name | New Name |
|----------|----------|
| `labelForTheAllVolumesSlider` | `volumesLabelForAllSlider` |

### New Features

- **Tabbed Advanced Editor**: The advanced editor now organizes configuration options into tabs by section (Common, Player, Favorites, Groups, Grouping, Volumes, Queue) for easier navigation.
- **Consistent Naming Convention**: All section-specific options now follow a consistent `{section}{PropertyName}` pattern, making it clearer which section each option affects.

### Migration Example

**Before:**
```yaml
type: custom:sonos-card
artworkAsBackground: true
artworkMinHeight: 10
hidePlayerArtwork: false
compactGroups: true
topFavorites:
  - My Playlist
  - Radio Station
```

**After:**
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
