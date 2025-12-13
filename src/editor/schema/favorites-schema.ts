export const FAVORITES_SCHEMA = [
  {
    name: 'favoritesTitle',
    type: 'string',
  },
  {
    name: 'favoritesHideBrowseMediaButton',
    selector: { boolean: {} },
  },
  {
    name: 'favoritesHideHeader',
    selector: { boolean: {} },
  },
  {
    name: 'favoritesHideTitleForThumbnailIcons',
    selector: { boolean: {} },
  },
  {
    name: 'favoritesIconBorder',
    type: 'string',
    help: 'Border for favorites icons (e.g., 1px solid white)',
  },
  {
    name: 'favoritesIconPadding',
    type: 'float',
    help: 'Padding around favorites icon artwork (rem)',
    valueMin: 0,
  },
  {
    name: 'favoritesIconTitleBackgroundColor',
    type: 'string',
    help: 'Background color for favorites icon titles',
  },
  {
    name: 'favoritesIconTitleColor',
    type: 'string',
    help: 'Color for favorites icon titles (e.g., red, #ff0000)',
  },
  {
    name: 'favoritesItemsPerRow',
    type: 'integer',
    valueMin: 1,
  },
  {
    name: 'favoritesNumberToShow',
    type: 'integer',
    valueMin: 1,
  },
  {
    name: 'favoritesReplaceHttpWithHttpsForThumbnails',
    selector: { boolean: {} },
  },
  {
    name: 'favoritesSortByType',
    selector: { boolean: {} },
  },
  {
    name: 'favoritesTopItems',
    type: 'string',
  },
];
