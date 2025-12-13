export const GROUPS_SCHEMA = [
  {
    name: 'groupsTitle',
    type: 'string',
  },
  {
    name: 'groupsButtonWidth',
    type: 'integer',
    help: 'Width of group buttons (rem)',
    valueMin: 1,
  },
  {
    name: 'groupsCompact',
    selector: { boolean: {} },
  },
  {
    name: 'groupsHideCurrentTrack',
    selector: { boolean: {} },
  },
  {
    name: 'groupsItemMargin',
    type: 'string',
    help: 'Margin around groups list items (e.g., 5px, 0.5rem)',
  },
];
