export const GROUPS_SCHEMA = [
  {
    name: 'title',
    type: 'string',
  },
  {
    name: 'backgroundColor',
    type: 'string',
    help: 'Background color for group buttons',
  },
  {
    name: 'buttonWidth',
    type: 'integer',
    help: 'Width of group buttons (rem)',
    valueMin: 1,
  },
  {
    name: 'compact',
    selector: { boolean: {} },
  },
  {
    name: 'hideCurrentTrack',
    selector: { boolean: {} },
  },
  {
    name: 'itemMargin',
    type: 'string',
    help: 'Margin around groups list items (e.g., 5px, 0.5rem)',
  },
  {
    name: 'speakersFontSize',
    type: 'float',
    help: 'Font size for speakers name (rem)',
    valueMin: 0.1,
  },
  {
    name: 'titleFontSize',
    type: 'float',
    help: 'Font size for track title (rem)',
    valueMin: 0.1,
  },
];
