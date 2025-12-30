const options = {
  player: 'Player',
  favorites: 'Favorites',
  groups: 'Groups',
  grouping: 'Grouping',
  volumes: 'Volumes',
  queue: 'Queue',
};

export const COMMON_SCHEMA = [
  {
    type: 'multi_select',
    options: options,
    name: 'sections',
  },
  {
    type: 'select',
    options: Object.entries(options).map((entry) => entry),
    name: 'startSection',
  },
  {
    type: 'string',
    name: 'title',
  },
  {
    name: 'adjustVolumeRelativeToMainPlayer',
    selector: { boolean: {} },
  },
  {
    name: 'allowPlayerVolumeEntityOutsideOfGroup',
    selector: { boolean: {} },
  },
  {
    name: 'baseFontSize',
    type: 'float',
    help: 'Base font size for the entire card (rem)',
    valueMin: 0.1,
  },
  {
    name: 'changeVolumeOnSlide',
    selector: { boolean: {} },
  },
  {
    name: 'doNotRememberSelectedPlayer',
    selector: { boolean: {} },
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
    name: 'fontFamily',
    type: 'string',
    help: 'Font family for the entire card (e.g., Arial, Roboto)',
  },
  {
    name: 'footerHeight',
    type: 'integer',
    valueMin: 0,
  },
  {
    name: 'heightPercentage',
    type: 'integer',
    default: 100,
    required: true,
  },
  {
    name: 'inverseGroupMuteState',
    selector: { boolean: {} },
  },
  {
    name: 'mediaTitleRegexToReplace',
    type: 'string',
  },
  {
    name: 'mediaTitleReplacement',
    type: 'string',
  },
  {
    name: 'minWidth',
    type: 'integer',
    help: 'Minimum width of the card (rem)',
    valueMin: 1,
  },
  {
    name: 'sectionButtonIconSize',
    type: 'float',
    help: 'Size of section button icons (rem)',
    valueMin: 0.1,
  },
  {
    name: 'storePlayerInSessionStorage',
    selector: { boolean: {} },
  },
  {
    name: 'volumeStepSize',
    type: 'integer',
    valueMin: 1,
  },
  {
    name: 'widthPercentage',
    type: 'integer',
    default: 100,
    required: true,
  },
];

export const ENTITIES_SCHEMA = [
  {
    name: 'entityId',
    help: 'Not needed, but forces this player to be the selected one on loading the card (overrides url param etc)',
    selector: { entity: { multiple: false, filter: { domain: 'media_player' } } },
  },
  {
    name: 'entities',
    help: 'Required, unless you have specified entity platform',
    cardType: 'maxi',
    selector: { entity: { multiple: true, filter: { domain: 'media_player' } } },
  },
  {
    name: 'entities',
    help: "Not needed, unless you don't want to include all of them",
    cardType: 'sonos',
    selector: { entity: { multiple: true, filter: { domain: 'media_player' } } },
  },
  {
    name: 'showNonSonosPlayers',
    help: 'Show all media players, including those that are not on the Sonos platform',
    cardType: 'sonos',
    selector: { boolean: {} },
  },
  {
    name: 'entityPlatform',
    help: 'Show all media players for the selected platform',
    type: 'string',
  },
  {
    name: 'entityNameRegexToReplace',
    type: 'string',
  },
  {
    name: 'entityNameReplacement',
    type: 'string',
  },
  {
    name: 'excludeItemsInEntitiesList',
    selector: { boolean: {} },
  },
];

export const PREDEFINED_GROUP_SCHEMA = [
  { type: 'string', name: 'name', required: true },
  { type: 'string', name: 'media' },
  { type: 'boolean', name: 'excludeItemsInEntitiesList' },
  {
    name: 'entities',
    selector: { entity: { multiple: true, filter: { domain: 'media_player' } } },
  },
];
