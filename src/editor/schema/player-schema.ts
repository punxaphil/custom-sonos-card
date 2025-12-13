export const PLAYER_SCHEMA = [
  {
    name: 'playerHideHeader',
    selector: { boolean: {} },
  },
  {
    name: 'allowPlayerVolumeEntityOutsideOfGroup',
    selector: { boolean: {} },
  },
  {
    name: 'playerArtworkAsBackground',
    selector: { boolean: {} },
  },
  {
    name: 'playerArtworkAsBackgroundBlur',
    selector: { number: { min: 0, max: 100, step: 1 } },
  },
  {
    name: 'playerArtworkHostname',
    type: 'string',
  },
  {
    name: 'playerArtworkMinHeight',
    type: 'integer',
    help: 'Minimum height of the artwork in rem',
    default: 5,
    required: true,
    valueMin: 0,
  },
  {
    name: 'playerBackgroundOverlayColor',
    type: 'string',
    help: 'Background overlay color when playerArtworkAsBackground is true (e.g., rgba(0,0,0, 0.3))',
  },
  {
    name: 'playerControlsAndHeaderBackgroundOpacity',
    selector: { number: { min: 0, max: 1, step: 0.1 } },
  },
  {
    name: 'playerControlsColor',
    type: 'string',
    help: 'Color for player control icons (e.g., pink, #ff69b4)',
  },
  {
    name: 'playerControlsLargeIcons',
    selector: { boolean: {} },
  },
  {
    name: 'playerControlsMargin',
    type: 'string',
    help: 'Margin around player controls (e.g., 0 3rem)',
  },
  {
    name: 'dynamicVolumeSlider',
    selector: { boolean: {} },
  },
  {
    name: 'dynamicVolumeSliderMax',
    type: 'integer',
    default: 30,
    required: true,
    valueMin: 1,
    valueMax: 100,
  },
  {
    name: 'dynamicVolumeSliderThreshold',
    type: 'integer',
    default: 20,
    required: true,
    valueMin: 1,
    valueMax: 100,
  },
  {
    name: 'entitiesToIgnoreVolumeLevelFor',
    help: 'If you want to ignore volume level for certain players in the player section',
    selector: { entity: { multiple: true, filter: { domain: 'media_player' } } },
  },
  {
    name: 'playerFallbackArtwork',
    type: 'string',
    help: 'Override default fallback artwork image if artwork is missing for the currently selected media',
  },
  {
    name: 'playerFastForwardAndRewindStepSizeSeconds',
    type: 'integer',
    default: 15,
    valueMin: 1,
  },
  {
    name: 'playerHeaderEntityFontSize',
    type: 'float',
    help: 'Font size for entity name in player header (rem)',
    valueMin: 0.1,
  },
  {
    name: 'playerHeaderSongFontSize',
    type: 'float',
    help: 'Font size for song title in player header (rem)',
    valueMin: 0.1,
  },
  {
    name: 'playerHideArtistAlbum',
    selector: { boolean: {} },
  },
  {
    name: 'playerHideArtwork',
    selector: { boolean: {} },
  },
  {
    name: 'playerHideControls',
    selector: { boolean: {} },
  },
  {
    name: 'playerHideControlNextTrackButton',
    selector: { boolean: {} },
  },
  {
    name: 'playerHideControlPowerButton',
    selector: { boolean: {} },
  },
  {
    name: 'playerHideControlPrevTrackButton',
    selector: { boolean: {} },
  },
  {
    name: 'playerHideControlRepeatButton',
    selector: { boolean: {} },
  },
  {
    name: 'playerHideControlShuffleButton',
    selector: { boolean: {} },
  },
  {
    name: 'playerHideEntityName',
    selector: { boolean: {} },
  },
  {
    name: 'playerHidePlaylist',
    selector: { boolean: {} },
  },
  {
    name: 'playerHideVolume',
    selector: { boolean: {} },
  },
  {
    name: 'playerHideVolumeMuteButton',
    selector: { boolean: {} },
  },
  {
    name: 'playerHideVolumePercentage',
    selector: { boolean: {} },
  },
  {
    name: 'playerLabelWhenNoMediaIsSelected',
    type: 'string',
  },
  {
    name: 'playerShowAudioInputFormat',
    selector: { boolean: {} },
  },
  {
    name: 'playerShowBrowseMediaButton',
    selector: { boolean: {} },
  },
  {
    name: 'playerShowChannel',
    selector: { boolean: {} },
  },
  {
    name: 'playerShowFastForwardAndRewindButtons',
    selector: { boolean: {} },
  },
  {
    name: 'playerShowSource',
    selector: { boolean: {} },
  },
  {
    name: 'playerShowVolumeUpAndDownButtons',
    selector: { boolean: {} },
  },
  {
    name: 'playerStopInsteadOfPause',
    selector: { boolean: {} },
  },
  {
    name: 'playerVolumeEntityId',
    selector: { entity: { multiple: false, filter: { domain: 'media_player' } } },
  },
  {
    name: 'playerVolumeMuteButtonSize',
    type: 'float',
    help: 'Size of mute button in player (rem)',
    valueMin: 0.1,
  },
  {
    name: 'playerVolumeSliderHeight',
    type: 'float',
    help: 'Height of volume slider in player (rem)',
    valueMin: 0.1,
  },
];
