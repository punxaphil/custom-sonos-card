export const MEDIA_BROWSER_SCHEMA = [
  {
    name: 'hideHeader',
    selector: { boolean: {} },
  },
  {
    name: 'itemsPerRow',
    type: 'integer',
    valueMin: 1,
  },
  {
    name: 'onlyFavorites',
    selector: { boolean: {} },
  },
];

export const FAVORITES_SUB_SCHEMA = [
  {
    name: 'title',
    type: 'string',
  },
  {
    name: 'exclude',
    type: 'string',
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
    name: 'numberToShow',
    type: 'integer',
    valueMin: 1,
  },
  {
    name: 'sortByType',
    selector: { boolean: {} },
  },
  {
    name: 'topItems',
    type: 'string',
  },
];
