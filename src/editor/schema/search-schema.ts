const mediaTypeOptions = {
  none: 'None',
  track: 'Track',
  artist: 'Artist',
  album: 'Album',
  playlist: 'Playlist',
  radio: 'Radio',
};

const viewModeOptions = {
  list: 'List',
  grid: 'Grid',
};

export const SEARCH_SCHEMA = [
  {
    name: 'title',
    type: 'string',
    help: 'Custom title for the search section',
  },
  {
    name: 'hideActivePlayerName',
    selector: { boolean: {} },
    help: 'Hide active player/group name in the search header',
  },
  {
    name: 'massConfigEntryId',
    type: 'string',
    help: 'Leave empty to auto-discover',
  },
  {
    type: 'select',
    options: Object.entries(mediaTypeOptions).map((entry) => entry),
    name: 'defaultMediaType',
  },
  {
    type: 'select',
    options: Object.entries(viewModeOptions).map((entry) => entry),
    name: 'defaultViewMode',
    help: 'Default view mode (default: list)',
  },
  {
    name: 'gridColumns',
    type: 'integer',
    help: 'Number of columns in grid view (default: 4)',
  },
  {
    name: 'searchLimit',
    type: 'integer',
    help: 'Max results per search (default: 50)',
  },
  {
    name: 'autoSearchMinChars',
    type: 'integer',
    help: 'Min characters to trigger auto-search (default: 2)',
  },
  {
    name: 'autoSearchDebounceMs',
    type: 'integer',
    help: 'Debounce delay in ms (default: 1000)',
  },
];
