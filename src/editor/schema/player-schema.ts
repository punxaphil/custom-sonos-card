export const PLAYER_SCHEMA = [
  {
    name: 'artworkAsBackground',
    selector: { boolean: {} },
  },
  {
    name: 'artworkAsBackgroundBlur',
    selector: { number: { min: 0, max: 100, step: 1 } },
  },
  {
    name: 'artworkBorderRadius',
    selector: { number: { min: 0, max: 100, step: 1 } },
    help: 'Border radius in pixels for player artwork',
  },
  {
    name: 'artworkHostname',
    type: 'string',
  },
  {
    name: 'artworkMinHeight',
    type: 'integer',
    help: 'Minimum height of the artwork in rem',
    default: 5,
    required: true,
    valueMin: 0,
  },
  {
    name: 'backgroundOverlayColor',
    type: 'string',
    help: 'Background overlay color when artworkAsBackground is true (e.g., rgba(0,0,0, 0.3))',
  },
  {
    name: 'controlsAndHeaderBackgroundOpacity',
    selector: { number: { min: 0, max: 1, step: 0.1 } },
  },
  {
    name: 'controlsColor',
    type: 'string',
    help: 'Color for player control icons (e.g., pink, #ff69b4)',
  },
  {
    name: 'controlsLargeIcons',
    selector: { boolean: {} },
  },
  {
    name: 'controlsMargin',
    type: 'string',
    help: 'Margin around player controls (e.g., 0 3rem)',
  },
  {
    name: 'fallbackArtwork',
    type: 'string',
    help: 'Override default fallback artwork image if artwork is missing for the currently selected media',
  },
  {
    name: 'fastForwardAndRewindStepSizeSeconds',
    type: 'integer',
    default: 15,
    valueMin: 1,
  },
  {
    name: 'headerEntityFontSize',
    type: 'float',
    help: 'Font size for entity name in player header (rem)',
    valueMin: 0.1,
  },
  {
    name: 'headerSongFontSize',
    type: 'float',
    help: 'Font size for song title in player header (rem)',
    valueMin: 0.1,
  },
  {
    name: 'hideArtistAlbum',
    selector: { boolean: {} },
  },
  {
    name: 'hideArtwork',
    selector: { boolean: {} },
  },
  {
    name: 'hideControls',
    selector: { boolean: {} },
  },
  {
    name: 'hideControlNextTrackButton',
    selector: { boolean: {} },
  },
  {
    name: 'hideControlPowerButton',
    selector: { boolean: {} },
  },
  {
    name: 'hideControlPrevTrackButton',
    selector: { boolean: {} },
  },
  {
    name: 'hideControlRepeatButton',
    selector: { boolean: {} },
  },
  {
    name: 'hideControlShuffleButton',
    selector: { boolean: {} },
  },
  {
    name: 'hideEntityName',
    selector: { boolean: {} },
  },
  {
    name: 'hideHeader',
    selector: { boolean: {} },
  },
  {
    name: 'hidePlaylist',
    selector: { boolean: {} },
  },
  {
    name: 'hideVolume',
    selector: { boolean: {} },
  },
  {
    name: 'hideVolumeMuteButton',
    selector: { boolean: {} },
  },
  {
    name: 'hideVolumePercentage',
    selector: { boolean: {} },
  },
  {
    name: 'labelWhenNoMediaIsSelected',
    type: 'string',
  },
  {
    name: 'showAudioInputFormat',
    selector: { boolean: {} },
  },
  {
    name: 'showBrowseMediaButton',
    selector: { boolean: {} },
  },
  {
    name: 'showChannel',
    selector: { boolean: {} },
  },
  {
    name: 'showFastForwardAndRewindButtons',
    selector: { boolean: {} },
  },
  {
    name: 'showSource',
    selector: { boolean: {} },
  },
  {
    name: 'showVolumeUpAndDownButtons',
    selector: { boolean: {} },
  },
  {
    name: 'stopInsteadOfPause',
    selector: { boolean: {} },
  },
  {
    name: 'volumeEntityId',
    selector: { entity: { multiple: false, filter: { domain: 'media_player' } } },
  },
  {
    name: 'volumeMuteButtonSize',
    type: 'float',
    help: 'Size of mute button in player (rem)',
    valueMin: 0.1,
  },
  {
    name: 'volumeSliderHeight',
    type: 'float',
    help: 'Height of volume slider in player (rem)',
    valueMin: 0.1,
  },
];
