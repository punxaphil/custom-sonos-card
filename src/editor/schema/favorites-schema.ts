export const FAVORITES_SCHEMA = [
  {
    name: 'title',
    type: 'string',
  },
  {
    name: 'hideBrowseMediaButton',
    selector: { boolean: {} },
  },
  {
    name: 'hideHeader',
    selector: { boolean: {} },
  },
  {
    name: 'hideTitleForThumbnailIcons',
    selector: { boolean: {} },
  },
  {
    name: 'iconBorder',
    type: 'string',
    help: 'Border for favorites icons (e.g., 1px solid white)',
  },
  {
    name: 'iconPadding',
    type: 'float',
    help: 'Padding around favorites icon artwork (rem)',
    valueMin: 0,
  },
  {
    name: 'iconTitleBackgroundColor',
    type: 'string',
    help: 'Background color for favorites icon titles',
  },
  {
    name: 'iconTitleColor',
    type: 'string',
    help: 'Color for favorites icon titles (e.g., red, #ff0000)',
  },
  {
    name: 'itemsPerRow',
    type: 'integer',
    valueMin: 1,
  },
  {
    name: 'numberToShow',
    type: 'integer',
    valueMin: 1,
  },
  {
    name: 'replaceHttpWithHttpsForThumbnails',
    selector: { boolean: {} },
  },
  {
    name: 'sortByType',
    selector: { boolean: {} },
  },
  {
    name: 'topItems',
    type: 'string',
  },
  {
    name: 'exclude',
    type: 'string',
  },
];
