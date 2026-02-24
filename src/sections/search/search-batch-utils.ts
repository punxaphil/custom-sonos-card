import { MediaPlayerItem, OperationProgress } from '../../types';
import { BatchCallbacks, SearchResultItem } from './search.types';
import type { EnqueueMode, MusicAssistantService } from '../../services/music-assistant-service';
import { queueItemsAfterCurrent } from '../../utils/batch-operation-utils';
import { toMediaPlayerItem } from './search-utils';
import Store from '../../model/store';

export function getSelectedItems(results: SearchResultItem[], selectedIndices: Set<number>): MediaPlayerItem[] {
  return Array.from(selectedIndices)
    .sort((a, b) => a - b)
    .map((i) => toMediaPlayerItem(results[i]));
}

export async function executeBatchPlay(
  store: Store,
  musicAssistantService: MusicAssistantService,
  items: MediaPlayerItem[],
  firstSelectedItem: SearchResultItem,
  enqueue: EnqueueMode,
  radioMode: boolean,
  callbacks: BatchCallbacks,
): Promise<void> {
  if (radioMode) {
    await musicAssistantService.playMedia(store.activePlayer, firstSelectedItem.uri, enqueue, true);
    callbacks.onComplete();
    return;
  }
  await runBatch(
    (onProgress, shouldCancel) =>
      store.mediaControlService.queueAndPlay(store.activePlayer, items, enqueue === 'replace' ? 'replace' : 'play', onProgress, shouldCancel),
    { current: 0, total: items.length, label: 'Loading' },
    callbacks,
  );
}

export async function executeBatchQueue(store: Store, items: MediaPlayerItem[], playMode: 'add' | 'next', callbacks: BatchCallbacks): Promise<void> {
  await runBatch(
    (onProgress, shouldCancel) =>
      queueItemsAfterCurrent(items, (item) => store.mediaControlService.playMedia(store.activePlayer, item, playMode), onProgress, shouldCancel),
    { current: 0, total: items.length, label: 'Queueing' },
    callbacks,
  );
}

async function runBatch(
  operation: (onProgress: (completed: number) => void, shouldCancel: () => boolean) => Promise<void>,
  initialProgress: OperationProgress,
  callbacks: BatchCallbacks,
): Promise<void> {
  callbacks.setProgress(initialProgress);
  try {
    await operation((completed) => callbacks.setProgress({ ...initialProgress, current: completed }), callbacks.shouldCancel);
    if (!callbacks.shouldCancel()) {
      callbacks.onComplete();
    }
  } finally {
    callbacks.setProgress(null);
  }
}
