import type { QueueSearchMatch, QueueSearchStorageState } from './queue.types';

export const QUEUE_SEARCH_STORAGE_KEY = 'sonos-queue-search-state';

export function restoreQueueSearchState(): QueueSearchStorageState | null {
  const saved = localStorage.getItem(QUEUE_SEARCH_STORAGE_KEY);
  if (!saved) {
    return null;
  }
  try {
    const state = JSON.parse(saved);
    return {
      expanded: !!state.expanded,
      searchText: state.searchText || '',
      showOnlyMatches: !!state.showOnlyMatches,
    };
  } catch {
    return null;
  }
}

export function saveQueueSearchState(state: QueueSearchStorageState) {
  localStorage.setItem(QUEUE_SEARCH_STORAGE_KEY, JSON.stringify(state));
}

export function findMatchIndices(items: { title: string }[], searchText: string): number[] {
  const searchLower = searchText.toLowerCase();
  return items.map((item, i) => (item.title?.toLowerCase().includes(searchLower) ? i : -1)).filter((i) => i !== -1);
}

export function getCurrentMatchIndex(matchIndices: number[], continueFromCurrent: boolean, lastHighlightedIndex: number): number {
  if (!continueFromCurrent || lastHighlightedIndex < 0) {
    return 0;
  }
  const nextMatchAfterLast = matchIndices.find((i) => i >= lastHighlightedIndex);
  return nextMatchAfterLast !== undefined ? matchIndices.indexOf(nextMatchAfterLast) : 0;
}

export function createQueueSearchMatch(index: number, currentMatchIndex: number, matchIndices: number[]): QueueSearchMatch {
  return {
    index,
    currentMatch: currentMatchIndex + 1,
    totalMatches: matchIndices.length,
    matchIndices,
  };
}
