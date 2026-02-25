export interface QueueSearchMatch {
  index: number;
  currentMatch: number;
  totalMatches: number;
  matchIndices: number[];
}

export interface QueueSearchStorageState {
  expanded: boolean;
  searchText: string;
  showOnlyMatches: boolean;
}

export type QueueSearchAction =
  | { type: 'match'; payload: QueueSearchMatch }
  | { type: 'select-all'; payload: { indices: number[] } }
  | { type: 'expanded'; payload: { expanded: boolean } }
  | { type: 'show-only'; payload: { showOnlyMatches: boolean; shownIndices: number[] } };

export type QueueSearchUiAction =
  | { type: 'input'; payload: { value: string } }
  | { type: 'keydown'; payload: { key: string } }
  | { type: 'next' }
  | { type: 'prev' }
  | { type: 'select-all' }
  | { type: 'toggle-show-only' }
  | { type: 'clear' };

export type QueueHeaderAction =
  | { type: 'toggle-select-mode' }
  | { type: 'invert-selection' }
  | { type: 'play-selected' }
  | { type: 'queue-selected-after-current' }
  | { type: 'queue-selected-at-end' }
  | { type: 'delete-selected' }
  | { type: 'clear-queue' };

export type QueueListAction =
  | { type: 'item-click'; payload: { displayIndex: number } }
  | { type: 'checkbox-change'; payload: { realIndex: number; checked: boolean } };

export type QueueHost = import('lit').ReactiveControllerHost & HTMLElement;

export interface QueueFetchResult {
  queueItems?: import('../../types').MediaPlayerItem[];
  queueHash?: string;
  currentQueueItemId?: string | null;
  clearError: boolean;
}

export interface QueueSearchUpdate {
  searchExpanded?: boolean;
  searchHighlightIndex?: number;
  searchMatchIndices?: number[];
  showOnlyMatches?: boolean;
  shownIndices?: number[];
  selectedIndices?: Set<number>;
}
