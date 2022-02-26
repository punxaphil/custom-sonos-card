# Sonos card for Home Assistant's Lovelace UI
Customized media player for sonos speakers!

Thanks to https://github.com/DBuit and https://github.com/exetico for creating this card.

## Features:

* Group/Ungroup speakers
* Control multiple speaker
* Play favorites from list
* Control individual volumes in a group
* Artwork background
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
To get the full width of the Sonos Card, please make sure to use `panel` mode in your Lovelace view. 
Read more here: https://www.home-assistant.io/lovelace/views/

After that add a card to the view, and in YAML mode add the following (configured according to your preferences):
```yaml
type: custom:custom-sonos-card
# Optional settings:
name: '' 
groupsTitle: '' 
groupingTitle: '' 
favoritesTitle: '' 
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
  favorites:
    width: '20%' # Default 33%
    mobileWidth: '80%' # Default 100%
  favorite:
    width: '20%' # Default 33%
    mobileWidth: '25%' # Default 16%
entities: # Deprecated, entities are now automatically discovered if you don't supply this setting
  - media_player.sonos_kitchen
  - media_player.sonos_hallway
  - media_player.sonos_bedroom
  - media_player.sonos_livingroom
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
  favorites:
    width: 60%
    mobileWidth: 70%
  favorite:
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
The following variables are available and can be set in your theme to change the appearence of the card.

| Name | Default |
|------|---------|
| --sonos-background-color | var(--card-background-color)
| --sonos-player-section-background | #ffffffe6
| --sonos-color | var(--secondary-text-color)
| --sonos-artist-album-text-color | var(--primary-text-color)
| --sonos-accent-color | var(--accent-color)
| --sonos-title-color | var(--card-background-color)
| --sonos-border-radius | 0.25rem
| --sonos-border-width | 0.125rem
| --sonos-favorites-multiline | nowrap

### Example
Here is a themed version with more rounded corners,different accent color and no transparency (thanks @giuliandenicola1).
![img/themed.png](https://github.com/johanfrick/custom-sonos-card/raw/master/img/themed.png)

## Dynamic volume level slider
The volume level slider is dynamically adjusting its scale. If volume is below 20% it will show a scale up to 30%. Above 20% it will show a scale up to 100%. The color will also change from green to red clearly indicating which scale is being used.

![img/volume-green.png](https://github.com/johanfrick/custom-sonos-card/raw/master/img/volume-green.png)

![img/volume-red.png](https://github.com/johanfrick/custom-sonos-card/raw/master/img/volume-red.png)


## Linking to specific player
Append `#media_player.my_sonos_player` to page URL to have that player selected. 
