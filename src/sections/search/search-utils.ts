import { mdiAccount, mdiAlbum, mdiMusic, mdiPlaylistMusic, mdiRadio } from '@mdi/js';
import { LibraryFilter, SearchMediaType, SearchResultItem, SearchState, SearchViewMode } from './search.types';
import { MediaPlayerItem } from '../../types';
import type { MusicAssistantService } from '../../services/music-assistant-service';

const LOCAL_STORAGE_KEY = 'sonos-search-state';

const MEDIA_TYPE_ICONS: Record<string, string> = {
  album: mdiAlbum,
  artist: mdiAccount,
  playlist: mdiPlaylistMusic,
  radio: mdiRadio,
  track: mdiMusic,
};

export function getMediaTypeIcon(mediaType: SearchMediaType): string {
  return MEDIA_TYPE_ICONS[mediaType] ?? mdiMusic;
}

export function toMediaPlayerItem(item: SearchResultItem): MediaPlayerItem {
  return {
    title: item.subtitle ? `${item.title} ${item.subtitle}` : item.title,
    media_content_id: item.uri,
    media_content_type: item.mediaType,
    thumbnail: item.imageUrl,
  };
}

export function getSearchTypeLabels(mediaTypes: Set<SearchMediaType>): string {
  if (mediaTypes.size === 0) {
    return 'all';
  }
  const labelMap: Record<string, string> = {
    track: 'tracks',
    artist: 'artists',
    album: 'albums',
    playlist: 'playlists',
    radio: 'radio',
  };
  return Array.from(mediaTypes)
    .map((t) => labelMap[t])
    .filter(Boolean)
    .join(', ');
}

export function saveSearchState(mediaTypes: Set<SearchMediaType>, searchText: string, libraryFilter: LibraryFilter, viewMode?: SearchViewMode): void {
  const state: SearchState = {
    mediaTypes: Array.from(mediaTypes),
    searchText,
    libraryFilter,
    viewMode,
  };
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
}

export function restoreSearchState(): { mediaTypes: Set<SearchMediaType>; searchText: string; libraryFilter: LibraryFilter; viewMode?: SearchViewMode } {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const state: SearchState = JSON.parse(saved);
      return {
        mediaTypes: state.mediaTypes ? new Set(state.mediaTypes) : new Set(),
        searchText: state.searchText ?? '',
        libraryFilter: state.libraryFilter ?? 'all',
        viewMode: state.viewMode,
      };
    }
  } catch {
    /* ignore parse errors */
  }
  return { mediaTypes: new Set(['track']), searchText: '', libraryFilter: 'all' };
}

export function cycleLibraryFilter(current: LibraryFilter): LibraryFilter {
  if (current === 'all') {
    return 'library';
  }
  return current === 'library' ? 'non-library' : 'all';
}

export async function toggleMassItemProperty(
  svc: MusicAssistantService,
  configEntryId: string,
  item: SearchResultItem,
  kind: 'favorite' | 'library',
): Promise<boolean> {
  const currentValue = kind === 'favorite' ? item.favorite : item.inLibrary;
  if (currentValue) {
    return kind === 'favorite'
      ? svc.removeFromFavorites(configEntryId, item.uri, item.mediaType, item.itemId, item.provider)
      : svc.removeFromLibrary(configEntryId, item.uri, item.mediaType, item.itemId, item.provider);
  }
  return kind === 'favorite' ? svc.addToFavorites(configEntryId, item.uri) : svc.addToLibrary(configEntryId, item.uri);
}

const ALL_SEARCH_TYPES: SearchMediaType[] = ['track', 'artist', 'album', 'playlist', 'radio'];

export async function performMassSearch(
  svc: MusicAssistantService,
  configEntryId: string,
  searchText: string,
  mediaTypes: Set<SearchMediaType>,
  libraryFilter: LibraryFilter,
  searchLimit: number,
): Promise<SearchResultItem[]> {
  const typesToSearch = mediaTypes.size > 0 ? Array.from(mediaTypes) : ALL_SEARCH_TYPES;
  return svc.searchMultipleTypes(configEntryId, searchText.trim(), typesToSearch, searchLimit, libraryFilter);
}
