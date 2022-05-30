# Sonos card for Home Assistant's Dashboard UI
Customized media player for sonos speakers!

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
* Configurable layout
* Dynamic volume level slider

and more!

![Screenshot of card](https://github.com/johanfrick/custom-sonos-card/raw/master/img/screenshot-custom-sonos-card.png)

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
To get the full width of the Sonos Card, please make sure to use `panel` mode in your Dashboard view.
Read more here: https://www.home-assistant.io/dashboards/panel/

After that add a card to the view, and in YAML mode add the following (configured according to your preferences):
```yaml
type: custom:custom-sonos-card
# Optional settings:
name: ''
groupsTitle: ''
groupingTitle: ''
mediaTitle: ''
headerImage: ''
shuffleFavorites: false
noMediaText: 'No media selected'
allVolumesText: 'All volumes'
entityNameRegexToReplace: 'SONOS ' # Regex pattern to replace parts of the entity names
entityNameReplacement: ''
layout:
  mobileThresholdPx: 500 # Default is 650
  groups:
    width: '20%' # Default 25%
    mobileWidth: '80%' # Default 100%
  players:
    width: '20%' # Default 25%
    mobileWidth: '80%' # Default 100%
  mediaBrowser:
    width: '20%' # Default 33%
    mobileWidth: '80%' # Default 100%
  mediaItem:
    width: '20%' # Default 33%
    mobileWidth: '25%' # Default 16%
mediaArtworkOverrides: # Show your own selected artwork if certain rules match
  - ifMissing: true
    imageUrl: https://cdn-icons-png.flaticon.com/512/651/651758.png
  - mediaTitleEquals: TV
    imageUrl: https://cdn-icons-png.flaticon.com/512/716/716429.png
    sizePercentage: 40
  - mediaContentIdEquals: "x-sonos-htastream:RINCON_949F3EC2E15B01400:spdif"
    imageUrl: https://cdn-icons-png.flaticon.com/512/4108/4108783.png
  - mediaTitleEquals: p4malmo-aac-192
    imageUrl: >-
      https://mytuner.global.ssl.fastly.net/media/tvos_radios/2BDTPrpMbn_cTdteqo.jpg
selectedPlayer: media_player.sonos_bedroom # Forces this player to be the selected one on loading the card (overrides url param etc)
customSources: # Main usecase is probably to set tv media player to play TV sound
  media_player.tv: # set this to 'all' to show the custom source for all players
    - title: TV
      thumbnail: https://cdn-icons-png.flaticon.com/512/716/716429.png
customThumbnailIfMissing: # for the media browser section
  Ed Sheeran Radio: https://i.scdn.co/image/ab6761610000e5eb4d2f80ceffc6c70a432ccd7c
  Legendary: https://i.scdn.co/image/ab67706f000000027b2e7ee752dc222ff2fd466f
backgroundBehindButtonSections: true # default is false, which means no background behind the different button sections
hideGroupCurrentTrack: true # default is false, which means song/track info for groups will be shown
skipAdditionalPlayerSwitches: true # default is false, which means additional switches will be shown in player if available (such as crossfade button)
disableDynamicVolumeSlider: true # default is false. See more in section further down.
mediaBrowserTitlesToIgnore:
  - Local Media
  - My Bad Playlist
entities: # Entities are automatically discovered if you don't supply this setting
  - media_player.sonos_kitchen
  - media_player.sonos_hallway
  - media_player.sonos_bedroom
  - media_player.sonos_livingroom
```

### Override artwork
Example:
![img/artwork_override.png](https://github.com/johanfrick/custom-sonos-card/raw/master/img/artwork_override.png)

Config:
```yaml
...
mediaArtworkOverrides:
  - mediaTitleEquals: TV
    imageUrl: https://cdn-icons-png.flaticon.com/512/716/716429.png
    sizePercentage: 40
...
```

## Layout
As seen in the yaml example above, layout can be controlled for the major sections.

Here is another example:
```yaml
layout:
  mobileThresholdPx: 500
  groups:
    width: 20%
    mobileWidth: 80%
  players:
    width: 20%
    mobileWidth: 90%
  mediaBrowser:
    width: 60%
    mobileWidth: 70%
  mediaItem:
    width: 20%
    mobileWidth: 50%
```

Example using the config above for screens wider than 500px:

![img/layout.png](https://github.com/johanfrick/custom-sonos-card/raw/master/img/layout.png)

And for mobile:

![img/layout_mobile.png](https://github.com/johanfrick/custom-sonos-card/raw/master/img/layout_mobile.png)

Yet another example (with different config):
![img/layout_2.png](https://github.com/johanfrick/custom-sonos-card/raw/master/img/layout_2.png)

## Theme variables
The following variables are available and can be set in your theme to change the appearance of the card.

Read more about using theme variables here: https://www.home-assistant.io/integrations/frontend/#defining-themes

| Name                                      | Default                                                           |
|-------------------------------------------|-------------------------------------------------------------------|
| `--sonos-background-color`                | `var(--ha-card-background, var(--card-background-color, white))`  |
| `--sonos-ha-card-background-color`        | `var(--ha-card-background, var(--card-background-color, white))`  |
| `--sonos-player-section-background`       | `#ffffffe6`                                                       |
| `--sonos-color`                           | `var(--secondary-text-color)`                                     |
| `--sonos-artist-album-text-color`         | `var(--secondary-text-color)`                                       |
| `--sonos-song-text-color`                 | `var(--sonos-accent-color)`                                       |
| `--sonos-accent-color`                    | `var(--accent-color)`                                             |
| `--sonos-title-color`                     | `var(--secondary-text-color)`                                    |
| `--sonos-border-radius`                   | `0.25rem`                                                         |
| `--sonos-border-width`                    | `0.125rem`                                                        |
| `--sonos-media-buttons-multiline`         | `nowrap`                                                          |
| `--sonos-button-section-background-color` | `var(--card-background-color)`                                                       |

### Default theme
Without changing any theme variables:
![img/default_theme.png](https://github.com/johanfrick/custom-sonos-card/raw/master/img/default_theme.png)


### Example with rounded corners

1. Add the following to your configuration.yaml
```
frontend:
  themes:
    rounded:
      sonos-border-radius: 20px
      sonos-background-color: white
      sonos-ha-card-background-color: '#eeeeee'
      sonos-color: black
      sonos-artist-album-text-color: gray
      sonos-song-text-color: black
      sonos-accent-color: green
      sonos-title-color: black
      sonos-border-width: 0rem
      sonos-button-section-background-color: '#ffffff00'
```

2. Then select theme `rounded`
3. This will give you:

![img/rounded.png](https://github.com/johanfrick/custom-sonos-card/raw/master/img/rounded.png)

### Example with dark theme
```yaml
sonos-background-color: var(--secondary-background-color)
sonos-ha-card-background-color: none
ha-card-box-shadow: none
sonos-artist-album-text-color: rgb(198, 203, 210)
sonos-title-color: rgb(198, 203, 210)
sonos-color: rgb(198, 203, 210)
sonos-player-section-background: rgb(32, 33, 36)
sonos-accent-color: rgb(198, 203, 210)
```
![img/dark.jpeg](https://github.com/johanfrick/custom-sonos-card/raw/master/img/dark.jpeg)

(Thanks to BeastHouse)

### Dark theme with focus on favorites
"I’ve become more reliant on playlists/favorites. I spent some time playing with the settings today that give a more ‘favorites’ focused layout that still looks good on mobile while providing more usable screen real estate on desktop." - Sergeantpup
![dark-favorites.png](https://github.com/johanfrick/custom-sonos-card/raw/master/img/dark-favorites.png)
```yaml
layout:
  mobileThresholdPx: 500
  groups:
    width: 20%
    mobileWidth: 100%
  players:
    width: 30%
    mobileWidth: 100%
  favorites:
    width: 50%
    mobileWidth: 100%
  favorite:
    width: 15%
    mobileWidth: 25%
```
## CSS Styling
For maximum control of look and feel, define your style with CSS under `styles`.

Many elements in the card can be styled using this, but not all. Using your web browser's developer console, inspect the element and check the CSS. If the CSS contains
`--sonos-card-style-name: [elementName];`, then the element can be styled using the `elementName`.

Example:
```yaml
styles:
  button-section:
    backgroundColor: lightyellow
    border: 1px solid blue
  ha-card:
    padding: 3rem
    background-size: contain
    background-image: >-
      url(https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Flag_of_Ukraine.svg/1200px-Flag_of_Ukraine.svg.png)
  groups:
    order: 1
  players:
    order: 2
  player-body:
    border: 5px black dashed
  player-song:
    color: '#005cbb'
    font-family: Times New Roman
    font-weight: 900
  media-browser:
    order: 0
  member:
    background: '#005cbb'
    color: yellow
  title:
    fontSize: 30px
    fontWeight: lighter
    textTransform: uppercase
    color: darkblue
```
The above YAML renders the following:

![img/stylable.png](https://github.com/johanfrick/custom-sonos-card/raw/master/img/stylable.png)

## Dynamic volume level slider
The volume level slider is dynamically adjusting its scale. If volume is below 20% it will show a scale up to 30%. Above 20% it will show a scale up to 100%. The color will also change from green to red clearly indicating which scale is being used.

![img/volume-green.png](https://github.com/johanfrick/custom-sonos-card/raw/master/img/volume-green.png)

![img/volume-red.png](https://github.com/johanfrick/custom-sonos-card/raw/master/img/volume-red.png)

Disable it in config with `disableDynamicVolumeSlider: true`

## Linking to specific player
Append `#media_player.my_sonos_player` to page URL to have that player selected.

If `selectedPlayer` is configured for the card, the url param will be ignored. See more in in the Usage section above.
