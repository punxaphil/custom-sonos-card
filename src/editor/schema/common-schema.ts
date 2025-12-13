export const COMMON_SCHEMA = [
  {
    name: 'baseFontSize',
    type: 'float',
    help: 'Base font size for the entire card (rem)',
    valueMin: 0.1,
  },
  {
    name: 'doNotRememberSelectedPlayer',
    selector: { boolean: {} },
  },
  {
    name: 'footerHeight',
    type: 'integer',
    valueMin: 0,
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
];
