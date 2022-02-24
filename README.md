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

and more!

![Screenshot of card](https://github.com/johanfrick/custom-sonos-card/raw/master/screenshot-custom-sonos-card.png)

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

## Linking to specific player
Append `#media_player.my_sonos_player` to page URL to have that player selected. 