export const GROUPING_SCHEMA = [
  {
    name: 'groupingTitle',
    type: 'string',
  },
  {
    name: 'groupingButtonColor',
    type: 'string',
    help: 'Background/accent color for grouping buttons',
  },
  {
    name: 'groupingButtonFontSize',
    type: 'float',
    help: 'Font size for grouping buttons (rem)',
    valueMin: 0.1,
  },
  {
    name: 'groupingCompact',
    selector: { boolean: {} },
  },
  {
    name: 'groupingDisableMainSpeakers',
    selector: { boolean: {} },
  },
  {
    name: 'groupingDontSortMembersOnTop',
    selector: { boolean: {} },
  },
  {
    name: 'groupingDontSwitchPlayer',
    selector: { boolean: {} },
  },
  {
    name: 'groupingHideUngroupAllButtons',
    selector: { boolean: {} },
  },
  {
    name: 'groupingSkipApplyButton',
    selector: { boolean: {} },
  },
];
