# Sonos card for Home Assistant's Dashboard UI

Media player card for Sonos speakers!

## Features:

* Group/Ungroup speakers
* Control multiple speaker
* Play favorites from list
* Media browser
* Control individual volumes in a group
* Artwork background
* Possibility to override artwork
* Shuffle and repeat mode
* Theming
* Configurable styling
* Dynamic volume level slider
* Track progress bar

and more!

![player.png](https://github.com/johanfrick/custom-sonos-card/raw/master/img/player.png)
![media_browser.png](https://github.com/johanfrick/custom-sonos-card/raw/master/img/media_browser.png)
![groups.png](https://github.com/johanfrick/custom-sonos-card/raw/master/img/groups.png)
![grouping.png](https://github.com/johanfrick/custom-sonos-card/raw/master/img/grouping.png)
![volumes.png](https://github.com/johanfrick/custom-sonos-card/raw/master/img/volumes.png)

## Support the project

Do you like the Sonos Card? Support the project with a coffee ☕️

[![BMC](https://www.buymeacoffee.com/assets/img/custom_images/white_img.png)](https://www.buymeacoffee.com/punxaphil)

## Installation

### HACS

This card is available in HACS (Home Assistant Community Store)

### Manual

Download the resources, as you would do with all other modules.

Add the custom card as a module, like this:

```yaml
resources:
  - url: /local/custom-sonos-card.js?v=1.0
    type: module
```

## Usage

### Individual sections

By default, all sections of the card is available and you can jump between them in the footer of the card.

However, you can also select individual sections to enable. Use this if you want to show the different sections next to
each (by adding multiple instances of the card with different sections enabled).

By using the section configuration you can utilise the full power of Home Assistant's layout capabilities and also drag
in other cards in your Sonos Dashboard view.

### Configuration

Use the Visual Editor in Home Assistant to configure the card. Most options are available there.

### Configuration in YAML

```yaml
type: custom:sonos-card # or one of the individual sections mentioned above
# All settings below are optional

# common for all sections
title: ''
sections: # see explanation further up
  - volumes
  - groups
  - grouping
  - media browser
  - player
widthPercentage: 75 # default is 100. Use this to change the width of the card.
heightPercentage: 75 # default is 100. Use this to change the height of the card.
entityId: media_player.sonos_bedroom # Forces this player to be the selected one on loading the card (overrides url param etc)
entityNameRegexToReplace: 'SONOS ' # Regex pattern to replace parts of the entity names
entityNameReplacement: ''
entities: # Entities are automatically discovered if you don't supply this setting
  - media_player.sonos_kitchen
  - media_player.sonos_hallway
  - media_player.sonos_bedroom
  - media_player.sonos_livingroom
excludeItemsInEntitiesList: true # Will invert the selection in the `entities` list, so that all players that are not in the list will be used.

# groups specific
groupsTitle: ''
hideGroupCurrentTrack: true # default is false, which means song/track info for groups will be shown

# groupings specific
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

# player specific
showVolumeUpAndDownButtons: true # default is false, shows buttons for increasing and decreasing volume
labelWhenNoMediaIsSelected: 'No media selected'
labelForTheAllVolumesSlider: 'All volumes'
mediaArtworkOverrides: # Show your own selected artwork if certain rules match
  - mediaTitleEquals: TV
    imageUrl: https://cdn-icons-png.flaticon.com/512/716/716429.png
    sizePercentage: 40
  - mediaContentIdEquals: "x-sonos-htastream:RINCON_949F3EC2E15B01400:spdif"
    imageUrl: https://cdn-icons-png.flaticon.com/512/4108/4108783.png
  - mediaTitleEquals: p4malmo-aac-192
    imageUrl: >-
      https://mytuner.global.ssl.fastly.net/media/tvos_radios/2BDTPrpMbn_cTdteqo.jpg
  - ifMissing: true # ifMissing will only be used if none of the "Equals" overrides above resulted in a match 
    imageUrl: https://cdn-icons-png.flaticon.com/512/651/651758.png
customSources: # Main use case is probably to set tv media player to play TV sound
  media_player.tv: # set this to 'all' to show the custom source for all players
    - title: TV
      thumbnail: https://cdn-icons-png.flaticon.com/512/716/716429.png
dynamicVolumeSlider: true # default is false. See more in section further down.
artworkHostname: http://192.168.0.59:8123 #default is ''. Usually not needed, but depending on your setup your device might not be able to access the artwork on the default host. One example where it could be needed is if you cast the dashboard with Google Cast.
showAudioInputFormat: true # default is false. Will show the audio input format (e.g. Dolby Digital) in the player section if available. By default, it will only show if the input format in the volumes section.

# media browser specific
mediaBrowserItemsPerRow: 4 # default is 1. Use this to show items as icons.
mediaBrowserShowTitleForThumbnailIcons: true # default is false. Only makes a difference if mediaBrowserItemsPerRow > 1. Will show title for thumbnail artworks.
customThumbnail:
  Voyage: https://i.scdn.co/image/ab67706f000000027b2e7ee752dc222ff2fd466f
customThumbnailIfMissing:
  Ed Sheeran Radio: https://i.scdn.co/image/ab6761610000e5eb4d2f80ceffc6c70a432ccd7c
  Legendary: https://i.scdn.co/image/ab67706f000000027b2e7ee752dc222ff2fd466f
  fallback: https://cdn-icons-png.flaticon.com/512/651/651717.png # will use this if thumbnail is missing and none of the above matches. Defaults to black music notes with white background.  
mediaBrowserTitlesToIgnore:
  - Local Media
  - My Bad Playlist
topFavorites: # Show these favorites at the top of the list
  - Legendary
  - Country Rocks
  - Kacey Musgraves Radio
numberOfFavoritesToShow: 10 # Use this to limit the amount of favorites to show
hideBrowseMediaButton: true # default is false. Hides the button to open the media browser.
```

## Using individual section cards

As mentioned earlier, use the individual sections for more layout flexibility.

Here is an example:

![sections.png](https://github.com/johanfrick/custom-sonos-card/raw/master/img/sections.png)

```yaml
type: horizontal-stack
cards:
  - type: custom:sonos-card
    sections:
      - groups
      - grouping
      - volumes
    widthPercentage: 100
  - type: vertical-stack
    cards:
      - type: entities
        entities:
          - type: button
            tap_action:
              action: navigate
              navigation_path: /
            icon: mdi:arrow-left-circle
            name: Back to home
      - type: custom:sonos-card
        sections:
          - player
  - type: custom:sonos-card
    sections:
      - media browser
```

## Theme variables

The following variables are being used and can be set in your theme to change the appearance of the card:
```
--accent-color
--primary-color
--secondary-text-color
--secondary-background-color
```

Read more about using theme variables here: https://www.home-assistant.io/integrations/frontend/#defining-themes

## CSS Styling

The recommend way to change look and feel is to use the built in theming capabilities in Home Assistant. If that is not enough this card supports being styled with [card_mod](https://github.com/thomasloven/lovelace-card-mod).

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

![styling.png](https://github.com/johanfrick/custom-sonos-card/raw/master/img/styling.png)

## Dynamic volume level slider

The volume level slider is dynamically adjusting its scale. If volume is below 20% it will show a scale up to 30%. Above
20% it will show a scale up to 100%. The color will also change from green to red clearly indicating which scale is
being used.

![dynamic_volumes.png](https://github.com/johanfrick/custom-sonos-card/raw/master/img/dynamic_volumes.png)

Enable it in config with `dynamicVolumeSlider: true`

## Linking to specific player

Append `#media_player.my_sonos_player` to page URL to have that player selected.

If `entityId` is configured for the card, the url param will be ignored. See more in the Usage section above.
