export const VOLUMES_SCHEMA = [
  {
    name: 'volumesTitle',
    type: 'string',
  },
  {
    name: 'adjustVolumeRelativeToMainPlayer',
    selector: { boolean: {} },
  },
  {
    name: 'changeVolumeOnSlide',
    selector: { boolean: {} },
  },
  {
    name: 'volumesHideCogwheel',
    selector: { boolean: {} },
  },
  {
    name: 'inverseGroupMuteState',
    selector: { boolean: {} },
  },
  {
    name: 'volumesLabelForAllSlider',
    type: 'string',
  },
  {
    name: 'volumeStepSize',
    type: 'integer',
    valueMin: 1,
  },
];
