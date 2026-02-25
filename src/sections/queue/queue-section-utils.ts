import type Store from '../../model/store';
import type { MediaPlayer } from '../../model/media-player';
import type { MediaPlayerItem, PlayMenuAction } from '../../types';
import type { QueueFetchResult, QueueSearchAction, QueueSearchUpdate } from './queue.types';

export const QUEUE_DEBOUNCE_MS = 500;

export const MASS_CONFIG_MESSAGE =
  'To see the Music Assistant queue, enable useMusicAssistant (or set entityPlatform: music_assistant) in the card configuration.';
export const MASS_QUEUE_MESSAGE = 'The current queue is not managed by Music Assistant.';
export const MASS_QUEUE_INSTALL_MESSAGE = 'To show the queue for Music Assistant, install the mass_queue integration from HACS: github.com/droans/mass_queue';

export function getQueueTitle(store: Store, activePlayer: MediaPlayer): string {
  if (store.config.queue?.title) {
    return store.config.queue.title;
  }
  const playlist = activePlayer.attributes.media_playlist ?? 'Play Queue';
  return activePlayer.attributes.media_channel ? `${playlist} (not active)` : playlist;
}

export function getSelectedQueueIndex(activePlayer: MediaPlayer, currentQueueItemId: string | null, queueItems: MediaPlayerItem[]): number {
  if (activePlayer.attributes.queue_position) {
    return activePlayer.attributes.queue_position - 1;
  }
  if (!currentQueueItemId) {
    return -1;
  }
  return queueItems.findIndex((item) => item.queueItemId === currentQueueItemId);
}

export function getDisplayItems(showOnlyMatches: boolean, shownIndices: number[], queueItems: MediaPlayerItem[]): MediaPlayerItem[] {
  return showOnlyMatches ? shownIndices.map((index) => queueItems[index]) : queueItems;
}

export function shouldShowConfigMessage(store: Store, activePlayer: MediaPlayer): boolean {
  return store.config.entityPlatform !== 'music_assistant' && activePlayer.attributes.media_playlist === 'Music Assistant';
}

export function queueNotManagedByMusicAssistant(store: Store, activePlayer: MediaPlayer): boolean {
  return store.config.entityPlatform === 'music_assistant' && activePlayer.attributes.active_queue == null;
}

export function resolveQueueItemIndex(displayIndex: number, showOnlyMatches: boolean, shownIndices: number[]): number {
  if (!showOnlyMatches || shownIndices.length === 0) {
    return displayIndex;
  }
  return shownIndices[displayIndex];
}

export function shouldSwitchToPlayerSection(action: PlayMenuAction): boolean {
  return action.enqueue === 'replace' || (action.enqueue === 'play' && !action.radioMode);
}

export async function fetchQueueData(store: Store, activePlayer: MediaPlayer, forceRefresh: boolean, lastQueueHash: string): Promise<QueueFetchResult> {
  const [queueItems, currentQueueItemId] = await Promise.all([
    store.hassService.getQueue(activePlayer),
    store.hassService.musicAssistantService.getCurrentQueueItemId(activePlayer),
  ]);
  const queueHash = queueItems.map((item) => item.title).join('|');
  const updatedQueueItems = forceRefresh || queueHash !== lastQueueHash ? queueItems : undefined;
  return { queueItems: updatedQueueItems, queueHash, currentQueueItemId, clearError: true };
}

export function applyQueueSearchAction(action: QueueSearchAction, searchMatchIndices: number[], selectedIndices: Set<number>): QueueSearchUpdate {
  if (action.type === 'match') {
    return { searchHighlightIndex: action.payload.index, searchMatchIndices: action.payload.matchIndices ?? [] };
  }
  if (action.type === 'show-only') {
    return { showOnlyMatches: action.payload.showOnlyMatches, shownIndices: action.payload.shownIndices };
  }
  if (action.type === 'expanded') {
    return { searchExpanded: action.payload.expanded };
  }
  if (action.type === 'select-all') {
    return { selectedIndices: new Set([...selectedIndices, ...searchMatchIndices]) };
  }
  return {};
}
