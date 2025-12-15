export const GROUPS_SCHEMA = [
  {
    name: 'title',
    type: 'string',
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
];
