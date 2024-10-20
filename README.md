# Sonos Card

Sonos Card for Home Assistant UI with a focus on managing multiple media players!

## Features:

* Group/Ungroup speakers
* Control multiple speakers
* Play favorites from list
* Media browser button
* Control individual volumes in a group
* Artwork background
* Possibility to override artwork
* Shuffle and repeat mode
* Theming
* Configurable styling
* Dynamic volume level slider
* Track progress bar

and more!

![player.png](https://github.com/punxaphil/custom-sonos-card/raw/main/img/player.png)
![media_browser.png](https://github.com/punxaphil/custom-sonos-card/raw/main/img/media_browser.png)
![groups.png](https://github.com/punxaphil/custom-sonos-card/raw/main/img/groups.png)
![grouping.png](https://github.com/punxaphil/custom-sonos-card/raw/main/img/grouping.png)
![volumes.png](https://github.com/punxaphil/custom-sonos-card/raw/main/img/volumes.png)

## Support the project

Do you like the Sonos Card? Support the project with a coffee ☕️

[![BMC](https://www.buymeacoffee.com/assets/img/custom_images/white_img.png)](https://www.buymeacoffee.com/punxaphil)

# Installation
## With HACS (recommended)
<!-- //#ONLY_SONOS_CARD
1. Download HACS following the instructions on https://hacs.xyz/docs/setup/download
1. Proceed to the initial configuration following the instructions on https://hacs.xyz/docs/configuration/basic
1. On your sidebar go to HACS
1. click on the icon at the right top corner then on Custom repositories
1. For the repository add this: https://github.com/punxaphil/maxi-media-player
1. For the category select Dashboard then click Add
1. Now click on Maxi Media Player then on the Download button
1. Go back on your dashboard and click on the icon at the right top corner then on Edit dashboard
1. You can now click on Add card in the bottom right corner and search for Maxi Media Player

Coming soon in the HACS default repo (still waiting for validation).
--> <!-- //#ONLY_SONOS_CARD -->
Recommended way of installing this card is with HACS (Home Assistant Community Store).<!-- //#ONLY_SONOS_CARD -->

## Without HACS
1. Download this file: custom-sonos-card.js
1. Add this file into your <config>/www folder
1. On your dashboard click on the icon at the right top corner then on Edit dashboard
1. Click again on that icon and then on Manage resources
1. Click on Add resource
1. Copy and paste this: /local/custom-sonos-card.js?v=1
1. Click on JavaScript Module then Create
1. Go back and refresh your page
1. You can now click on Add card in the bottom right corner and search for Maxi Media Player
1. After any update of the file you will have to edit /local/custom-sonos-card.js?v=1 and change the version to any higher number

## Usage

### Individual sections

By default, all sections of the card is available, and you can jump between them in the footer of the card.

However, you can also select individual sections to enable. Use this if you want to show the different sections next to
each other (by adding multiple instances of the card with different sections enabled).

By using the section configuration you can utilise the full power of Home Assistant's layout capabilities and also drag in other cards in your Dashboard view.

### Configuration

Use the Visual Editor in Home Assistant to configure the card. Most options are available there.

### Configuration in YAML

<!-- //#ONLY_SONOS_CARD
```yaml
type: custom:maxi-media-player
entities: # Required unless you specify entityPlatform
  - media_player.kitchen_player
  - media_player.hallway_player
  - media_player.bedroom_player
  - media_player.livingroom_player
excludeItemsInEntitiesList: true # Will invert the selection in the `entities` list, so that all players that are not in the list will be used.
entityPlatform: sonos # will select all entities for this platform. Will override the `entities` list if set.
```
--> <!-- //#ONLY_SONOS_CARD -->
<!-- //#ONLY_SONOS_CARD_START -->
```yaml
type: custom:sonos-card
entities: # Entities are automatically discovered if you don't supply this setting. You can also use this sort your entities in a specific order (instead of alphabetically).
  - media_player.sonos_kitchen
  - media_player.sonos_hallway
  - media_player.sonos_bedroom
  - media_player.sonos_livingroom
excludeItemsInEntitiesList: true # Will invert the selection in the `entities` list, so that all players that are not in the list will be used.
showNonSonosPlayers: true # default is false, which means only Sonos players will be shown.
```
<!-- //#ONLY_SONOS_CARD_END -->

All settings below are optional
```yaml
# common for all sections
title: ''
sections: # see explanation further up
  - volumes
  - groups
  - grouping
  - media browser
  - player
widthPercentage: 75 # default is 100. Use this to change the width of the card.
heightPercentage: 75 # default is 100. Use this to change the height of the card. Set to 'auto' to make the card height adjust to the content.
entityId: media_player.bedroom # Forces this player to be the selected one on loading the card (overrides url param etc)
entityNameRegexToReplace: ' PLAYER' # Regex pattern to replace parts of the entity names
entityNameReplacement: ''
volumeStepSize: 1 # Use this to change the step size when using volume up/down. Default is to use the step size of Home Assistant's media player integration. 
adjustVolumeRelativeToMainPlayer: true # default is false, which means all players will be set to the same volume as the main player. If set to true, volume will be adjusted relative to the main player in the group.
sectionButtonIcons: # customize icons for the section buttons
  player: mdi:ab-testing
  mediaBrowser: mdi:star-box-multiple
  groups: mdi:multicast
  grouping: mdi:group
  volumes: mdi:volume-high
  
# groups specific
groupsTitle: ''
hideGroupCurrentTrack: true # default is false, which means song/track info for groups will be shown

# grouping specific
groupingTitle: ''
predefinedGroups: # defaults to empty
  - name: Inside
    volume: 15 # If you want to set the volume of all speakers when grouping
    unmuteWhenGrouped: true # If you want to unmute all speakers when grouping
    entities:
      - media_player.bedroom
      - media_player.hall
  - name: Kitchen&Hall
    media: Legendary # If you want to start playing a specific favorite when grouping 
    entities: # Use below format if you want to set the volume of the speakers when grouping
      - player: media_player.kitchen
        volume: 10
      - player: media_player.hall
        volume: 5
  - name: All (except TV)
    excludeItemsInEntitiesList: true # Invert entities selection, so that all players will be grouped except those in the entities list
    entities: 
      - media_player.tv
skipApplyButtonWhenGrouping: true # default is false. Will skip the apply button when grouping.
dontSwitchPlayerWhenGrouping: true # default is false. Will not switch to another player if main player is ungrouped.
groupingButtonIcons: # Use this to set custom icons for the grouping buttons.
  predefinedGroup: mdi:account-group # default is mdi:speaker-multiple
  joinAll: mdi:account-multiple # default is mdi:checkbox-multiple-marked-outline
  unJoinAll: mdi:account-remove # default is mdi:minus-box-multiple-outline

# player specific
hidePlayerControlNextTrackButton: true # default is false, hides player control next track button.
hidePlayerControlPrevTrackButton: true # default is false, hides player control previous track button.
hidePlayerControlRepeatButton: true # default is false, hides player control track repeat mode button.
hidePlayerControlShuffleButton: true # default is false, hides player control track shuffle mode button.
hidePlayerControlPowerButton: true # default is false, hides player control power button if media player TURN_ON feature is enabled.  This setting does nothing if media player TURN_ON feature is not supported.
showVolumeUpAndDownButtons: true # default is false, shows buttons for increasing and decreasing volume
showFastForwardAndRewindButtons: true # default is false, shows fast forward and rewind buttons
fastForwardAndRewindStepSizeSeconds: 60 # default is 15 seconds
labelWhenNoMediaIsSelected: 'No media selected'
labelForTheAllVolumesSlider: 'All volumes'
mediaArtworkOverrides: # Show your own selected artwork if certain rules match
  - mediaTitleEquals: TV
    imageUrl: https://cdn-icons-png.flaticon.com/512/716/716429.png
    sizePercentage: 40
  - mediaContentIdEquals: "x-htastream:RINCON_949F3EC2E15B01400:spdif"
    imageUrl: https://cdn-icons-png.flaticon.com/512/4108/4108783.png
  - mediaTitleEquals: p4malmo-aac-192
    imageUrl: >-
      https://mytuner.global.ssl.fastly.net/media/tvos_radios/2BDTPrpMbn_cTdteqo.jpg
  - mediaArtistEquals: Metallica
    imageUrl: >-
      https://mytuner.global.ssl.fastly.net/media/tvos_radios/2BDTPrpMbn_cTdteqo.jpg
  - mediaAlbumNameEquals: "Master of Puppets"
    imageUrl: >-
      https://mytuner.global.ssl.fastly.net/media/tvos_radios/2BDTPrpMbn_cTdteqo.jpg
  - mediaChannelEquals: "Sky Radio Smooth Hits"
    imageUrl: https://cdn-icons-png.flaticon.com/512/4108/4108794.png
  - ifMissing: true # ifMissing will only be used if none of the "Equals" overrides above resulted in a match 
    imageUrl: https://cdn-icons-png.flaticon.com/512/651/651758.png
customSources: # Read more in 'Custom Favorites / Sources' section below
  media_player.tv: # set this to 'all' to show the custom source for all players
    - title: TV # Must match the name of the source (unless you specify media_content_id/type as shown below)
      thumbnail: https://cdn-icons-png.flaticon.com/512/716/716429.png
  all:
    - title: BBC
      media_content_id: media-source://radio_browser/98adecf7-2683-4408-9be7-02d3f9098eb8
      media_content_type: music
      thumbnail: http://cdn-profiles.tunein.com/s24948/images/logoq.jpg?t=1
dynamicVolumeSlider: true # default is false. See more in section further down.
dynamicVolumeSliderThreshold: 30 # default is 20. Use this to change the threshold for the dynamic volume slider.
dynamicVolumeSliderMax: 40 # default is 30. Use this to change the max value for the dynamic volume slider.
artworkHostname: http://192.168.0.59:8123 #default is ''. Usually not needed, but depending on your setup your device might not be able to access the artwork on the default host. One example where it could be needed is if you cast the dashboard with Google Cast.
showAudioInputFormat: true # default is false. Will show the audio input format (e.g. Dolby Digital) in the player section if available. By default, it will only show if the input format in the volumes section.
fallbackArtwork: https://cdn-icons-png.flaticon.com/512/651/651717.png # Override default fallback artwork image if artwork is missing for the currently selected media.
entitiesToIgnoreVolumeLevelFor: # default is empty. Use this if you want to ignore volume level for certain players in the player section. Useful if you have a main device with fixed volume.
  - media_player.my_sonos_port_device
artworkMinHeight: 10 # default is 5. Use this to change the minimum height of the artwork in the player section. Unit is in rem.
artworkAsBackground: true # default is false. Will show the artwork as background for the player section.
playerVolumeEntityId: media_player.bedroom # default is empty. Use this to control the volume of another player in the player section. Entity ID must the selected player or part of the selected player's group, otherwise it will not be controlled.
showSourceInPlayer: true # default is false. Will show the source (if available) in the player section.
showBrowseMediaInPlayerSection: true # default is false. Will show the browse media button in the player section.
showChannelInPlayer: true # default is false. Will show the channel (if available) in the player section. This can for instance be the radio station name.
hidePlaylistInPlayer: true # default is false. Will hide the playlist name in the player section.

# media browser specific
mediaBrowserItemsPerRow: 1 # default is 4. Use this to show items as list.
mediaBrowserHideTitleForThumbnailIcons: true # default is false. Only makes a difference if mediaBrowserItemsPerRow > 1. Will hide title for thumbnail artworks.
customThumbnail:
  Voyage: https://i.scdn.co/image/ab67706f000000027b2e7ee752dc222ff2fd466f
customThumbnailIfMissing:
  Ed Sheeran Radio: https://i.scdn.co/image/ab6761610000e5eb4d2f80ceffc6c70a432ccd7c
  Legendary: https://i.scdn.co/image/ab67706f000000027b2e7ee752dc222ff2fd466f
  fallback: https://cdn-icons-png.flaticon.com/512/651/651717.png # will use this if thumbnail is missing and none of the above matches. Defaults to black music notes with white background.  
favoritesToIgnore:
  - My Favorite Album
  - My Bad Playlist
topFavorites: # Show these favorites at the top of the list
  - Legendary
  - Country Rocks
  - Kacey Musgraves Radio
numberOfFavoritesToShow: 10 # Use this to limit the amount of favorites to show
hideBrowseMediaButton: true # default is false. Hides the button to open the media browser.
replaceHttpWithHttpsForThumbnails: true # default is false. Use this if you  want to replace http with https for thumbnails. 
mediaBrowserTitle: My favorites # default is 'All favorites'. Use this to change the title for the media browser/favorites section.

# volumes specific
hideVolumeCogwheel: true # default is false. Will hide the cogwheel for the volumes section.

# queue specific
queueTitle: Songs # default is 'Play Queue'. Use this to change the title for the queue section.
```

## Using individual section cards

As mentioned earlier, use the individual sections for more layout flexibility.

Here is an example:

![sections.png](https://github.com/punxaphil/custom-sonos-card/raw/main/img/sections.png)
```yaml
type: horizontal-stack
cards:
  - type: custom:sonos-card
    sections:
      - groups
      - volumes
  - type: custom:sonos-card
    sections:
      - player
  - type: custom:sonos-card
    sections:
      - grouping
      - media browser
```

## Theme variables

The following variables are being used and can be set in your theme to change the appearance of the card:
```
--accent-color
--primary-color
--secondary-text-color
--secondary-background-color
--disabled-text-color
```

Read more about using theme variables here: https://www.home-assistant.io/integrations/frontend/#defining-themes

## Custom Favorites / Sources

You can add your own buttons to the Favorites section. This can be useful if you want to quickly start a specific radio station or playlist.

To determine what to configure for a button do the following:
1. Start playing the radio station or playlist you want to add. This can for instance be done in this card's media browser or in the built-in Home Assistant Media page.
2. Open the Developer Tools in Home Assistant.
3. Go to the States tab.
4. Find the media player entity that is playing the radio station or playlist.
5. Look for the `media_content_id` and `media_content_type` attributes.
6. For the thumbnail, you can inspect the HTML to see what image the media browser is using, or you can also use a local URL if you have the image stored locally.
7. Use these values to configure the custom source.

Example:
![custom_sources.png](https://github.com/punxaphil/custom-sonos-card/raw/main/img/custom_sources.png)
    
```yaml
type: custom:sonos-card
customSources: 
  all: # 'all' means it will show for all players, otherwise specify the entity_id of the player.
    - title: BBC
      media_content_id: x-rincon-mp3radio://http://stream.live.vc.bbcmedia.co.uk/bbc_world_service
      media_content_type: music
      thumbnail: http://cdn-profiles.tunein.com/s24948/images/logoq.jpg?t=1
```

## Dynamic volume level slider

The volume level slider is dynamically adjusting its scale. If volume is below 20% it will show a scale up to 30%. Above
20% it will show a scale up to 100%. The color will also change from green to red clearly indicating which scale is
being used.

![dynamic_volumes.png](https://github.com/punxaphil/custom-sonos-card/raw/main/img/dynamic_volumes.png)

Enable it in config with `dynamicVolumeSlider: true`

## Linking to specific player

Append `#media_player.my_sonos_player` to page URL to have that player selected.

If `entityId` is configured for the card, the url param will be ignored. See more in the Usage section above.

## Sort order of entities

If you want to have a custom sorting for your entities in the groups section you can use the `entities` configuration. 
Default is otherwise to sort by entity name.

Example:
```yaml
type: custom:sonos-card
entities:
  - media_player.sonos_kitchen
  - media_player.sonos_hallway
  - media_player.sonos_bedroom
  - media_player.sonos_livingroom
```


## CSS Styling

The recommend way to change look and feel is to use the built-in theming capabilities in Home Assistant. If that is not enough this card supports being styled with [card_mod](https://github.com/thomasloven/lovelace-card-mod).

Example:

```yaml
type: custom:sonos-card
card_mod:
  style: |
    ha-card {
      color: white !important;
      background: gray;
      --accent-color: pink;
      --primary-color: white;
      --secondary-text-color: white;
      --secondary-background-color: pink;
    }
```

The above YAML renders the following:

![styling.png](https://github.com/punxaphil/custom-sonos-card/raw/main/img/styling.png)

<!-- //#ONLY_SONOS_CARD_START -->
### More card_mod examples

### Example 1 - Reduce margin for grouping list items

![card_mod_grouping_margin.png](https://github.com/punxaphil/custom-sonos-card/raw/main/img/card_mod_grouping_margin.png)

```yaml
card_mod:
  style:
    sonos-groups$ sonos-group$: |
      mwc-list-item {
        margin: 5px !important;
      }
      .row {
        margin: 0 !important;
      }
```

### Example 2 - Resize volume and icons

```yaml
card_mod:
  style:
    .: |
    sonos-player$ sonos-player-controls$ sonos-volume$: |
      ha-control-slider {
        height: 10px;
      }
      ha-icon-button {
        --mdc-icon-button-size: 2rem !important;
        --mdc-icon-size: 1.5rem !important;
      }    

```

### Example 3 - Change the font and background color of grouping button

```yaml
card_mod:
  style:
    sonos-grouping$: |
      sonos-grouping-button {
        --accent-color: black;
        font-size: 30px;
      }
```

### Example 4 - Resize controls area in player section

```yaml
card_mod:
  style:
    sonos-player$: |
      .controls {
        margin: 0 3rem !important;
      }
```

### Example 5 - Hide entity/group name

```yaml
card_mod:
  style:
    sonos-player$ sonos-player-header$: |
      .entity {
        display: none;
      }
```

### Example 6 - More transparent title track and volume slider

```yaml
card_mod:
  style:
    .: ''
    sonos-player$: |
      .controls {
        background-color: rgba(var(--rgb-card-background-color), 0.4) !important;
      }
      sonos-player-header {
        background-color: rgba(var(--rgb-card-background-color), 0.4) !important;
      }
```

### Example 7 - Make the padding smaller around the artwork of the thumbnails in the favorites section

```yaml
card_mod:
  style:
    sonos-media-browser$: |
      .button {
        --control-button-padding: 4px;
      }
```

### Example 8 - Remove artwork in player section

```yaml
card_mod:
  style:
    sonos-player$: |
      .artwork {
        display: none !important;
      }
```

### Example 9 - Hide volume slider

```yaml
card_mod:
  style:
    "sonos-player$ sonos-player-controls$": |
      sonos-volume {
        display: none;
      }
```

### Example 10 - Hide background from controls when artwork is shown as background

```yaml
artworkAsBackground: true
card_mod:
  style: |
    ha-card {
      --rgb-card-background-color: false;
    }
```

### Example 11 - Modify transparency of background from controls when artwork is shown as background

```yaml
artworkAsBackground: true
card_mod:
  style: 
    sonos-player$: |
      [background] {
        background-color: rgba(0,0,0, 0.3) !important;
      }
```

### Example 12 - Show only player and now playing text information

```yaml
heightPercentage: auto
sections:
  - player
card_mod:
  style:
    sonos-player$: |
      .artwork {
        display: none;
      }
      .controls {
        display: none;
      }
```

### Example 13 - Style the favorite section

```yaml
card_mod:
  style:
    sonos-media-browser$ sonos-media-browser-icons$: |
      div {            
        border: 1px solid white;
        color: red !important;
      }  
```

### Example 14 - Color of the player controls

```yaml
card_mod:
  style:
    sonos-player$ sonos-player-controls$: |
      .icons * {    
        color: pink;
      }
```

### Example 15 - Remove the top "All favorites" and "Browse media" from the favorites section

```yaml
card_mod:
  style:
    sonos-media-browser$: |
      sonos-media-browser-header {
        display: none;
      }
```

### Example 16 - Change colors of titles in favorites

```yaml
card_mod:
  style:
    sonos-media-browser$ sonos-media-browser-icons$: |
      .title {            
        color: red !important;
        background-color: blue !important; 
      }  
```

### Example 17 - Remove everything except the album art

```yaml
card_mod:
  style:
    sonos-player$: |
      sonos-player-header, sonos-player-controls {
        display: none;
      }
```

### Example 18 - Hide the volume button and percentage

```yaml
card_mod:
  style:
    sonos-player$ sonos-player-controls$ sonos-volume$: |
      .volume-level, ha-icon-button {
        display:none !important;
      }
```

![img.png](https://github.com/punxaphil/custom-sonos-card/raw/main/img/card_mod_2.png)

### Example 19 - Changing the font size of song title

```yaml
card_mod:
  style:
    sonos-player$ sonos-player-header$: |
      .song {
        font-size: 1.2em; !important;
      }
```

### Example 20 - Artwork position

```yaml
heightPercentage: auto
card_mod:
  style:
    sonos-player$: |
      .container {        
        grid-template-areas:
            'header artwork'
            'controls artwork' !important;
        grid-template-columns: 2fr 1fr !important;
      }
```

![img.png](https://github.com/punxaphil/custom-sonos-card/raw/main/img/card_mod_3.png)

### Example 21 - Size of group buttons

```yaml
card_mod:
  style:
    sonos-groups$: |
      mwc-list {
        width: 10rem;
      }
```

### Example 22 - Font size for everything

```yaml
card_mod:
  style: |
      div {
        font-size: 22px !important;
      }
```

### Example 23 - Increase entity font
```
card_mod:
  style:
    sonos-player$ sonos-player-header$: |
      .entity {
        font-size: 12px !important;
      }
```

### Example 24 - Hide the select all/none buttons at the top of the groupings page
```
card_mod:
  style:
    sonos-grouping$: |
      sonos-grouping-button {            
        display: none;
      }  
```

### Example 25 - reduce min-width of the card
```
widthPercentage: 30
card_mod:
  style:
    .: |
      ha-card {            
        min-width: 10rem !important;
      }  
```

<!-- //#ONLY_SONOS_CARD_END -->
