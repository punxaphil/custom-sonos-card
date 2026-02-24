import { OperationProgress } from '../../types';
import type { MusicAssistantService } from '../../services/music-assistant-service';
import type { PlayMenuAction } from '../../types';

export type SearchMediaType = 'artist' | 'album' | 'track' | 'playlist' | 'radio';

export type LibraryFilter = 'all' | 'library' | 'non-library';

export interface SearchConfig {
  massConfigEntryId?: string;
  defaultMediaType?: SearchMediaType;
  searchLimit?: number;
  title?: string;
  autoSearchMinChars?: number;
  autoSearchDebounceMs?: number;
}

export interface MusicAssistantSearchResult {
  media_type: string;
  name: string;
  uri: string;
  version?: string;
  favorite?: boolean;
  in_library?: boolean;
  image?:
    | string
    | {
        path?: string;
        provider?: string;
        remotely_accessible?: boolean;
      };
  artists?: Array<{
    name: string;
    item_id: string;
  }>;
  album?: {
    name: string;
    item_id: string;
  };
  sort_name?: string;
  item_id: string;
  provider: string;
  provider_mappings?: Array<{
    item_id: string;
    provider_domain: string;
    provider_instance: string;
    url?: string;
  }>;
}

export interface MusicAssistantSearchResponse {
  artists?: MusicAssistantSearchResult[];
  albums?: MusicAssistantSearchResult[];
  tracks?: MusicAssistantSearchResult[];
  playlists?: MusicAssistantSearchResult[];
  radio?: MusicAssistantSearchResult[];
}

export interface SearchResultItem {
  title: string;
  subtitle?: string;
  uri: string;
  mediaType: SearchMediaType;
  imageUrl?: string;
  favorite?: boolean;
  inLibrary?: boolean;
  itemId?: string;
  provider?: string;
}

export interface SearchExecutionState {
  results: SearchResultItem[];
  loading: boolean;
  error: string | null;
}

export interface SearchHost {
  musicAssistantService: MusicAssistantService;
  massConfigEntryId: string;
  results: SearchResultItem[];
  loading: boolean;
  error: string | null;
}

export interface SearchState {
  mediaTypes?: SearchMediaType[];
  searchText: string;
  libraryFilter?: LibraryFilter;
}

export interface BatchCallbacks {
  setProgress: (p: OperationProgress | null) => void;
  shouldCancel: () => boolean;
  onComplete: () => void;
}

export type SearchFilterAction = { type: 'toggle-media-type'; mediaType: SearchMediaType } | { type: 'toggle-library-filter' } | { type: 'close' };

export type SearchHeaderAction =
  | { type: 'toggle-media-type'; mediaType: SearchMediaType }
  | { type: 'toggle-select-mode' }
  | { type: 'toggle-library-filter' }
  | { type: 'invert-selection' }
  | { type: 'selection-action'; action: PlayMenuAction };
