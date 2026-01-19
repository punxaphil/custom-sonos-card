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

export const SHORTCUT_SUB_SCHEMA = [
  {
    name: 'media_content_id',
    type: 'string',
    help: 'The content ID of the folder (use browser DevTools to find this)',
  },
  {
    name: 'media_content_type',
    type: 'string',
    help: 'The content type (e.g., spotify://library)',
  },
  {
    name: 'icon',
    type: 'string',
    help: 'Icon for the button (e.g., mdi:spotify). Default is bookmark icon.',
  },
  {
    name: 'name',
    type: 'string',
    help: 'Tooltip/name for the shortcut button',
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
    name: 'typeColor',
    type: 'string',
    help: 'Color for type headers when sortByType is enabled',
  },
  {
    name: 'typeFontSize',
    type: 'string',
    help: 'Font size for type headers (e.g., 18px)',
  },
  {
    name: 'typeFontWeight',
    type: 'string',
    help: 'Font weight for type headers (e.g., normal, bold)',
  },
  {
    name: 'typeMarginBottom',
    type: 'string',
    help: 'Bottom margin for type headers (e.g., 6px)',
  },
  {
    name: 'topItems',
    type: 'string',
  },
];
