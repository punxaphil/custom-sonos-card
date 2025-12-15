export const GROUPING_SCHEMA = [
  {
    name: 'title',
    type: 'string',
  },
  {
    name: 'buttonColor',
    type: 'string',
    help: 'Background/accent color for grouping buttons',
  },
  {
    name: 'buttonFontSize',
    type: 'float',
    help: 'Font size for grouping buttons (rem)',
    valueMin: 0.1,
  },
  {
    name: 'compact',
    selector: { boolean: {} },
  },
  {
    name: 'disableMainSpeakers',
    selector: { boolean: {} },
  },
  {
    name: 'dontSortMembersOnTop',
    selector: { boolean: {} },
  },
  {
    name: 'dontSwitchPlayer',
    selector: { boolean: {} },
  },
  {
    name: 'hideUngroupAllButtons',
    selector: { boolean: {} },
  },
  {
    name: 'skipApplyButton',
    selector: { boolean: {} },
  },
];
