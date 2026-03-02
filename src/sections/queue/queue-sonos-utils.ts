import type Store from '../../model/store';
import type { MediaPlayer } from '../../model/media-player';
import type { MediaPlayerItem, OperationProgress } from '../../types';

export async function queueAfterCurrent(
  store: Store,
  activePlayer: MediaPlayer,
  queueItems: MediaPlayerItem[],
  index: number,
  setProgress: (p: OperationProgress | null) => void,
  shouldCancel: () => boolean,
  onDone: () => Promise<void>,
) {
  const item = queueItems[index];
  if (!item?.media_content_id) {
    return;
  }
  const queuePosition = activePlayer.attributes.queue_position;
  const currentIndex = queuePosition ? queuePosition - 1 : -1;
  setProgress({ current: 0, total: 1, label: 'Moving' });
  try {
    await store.mediaControlService.moveQueueItemAfterCurrent(activePlayer, item, index, currentIndex);
    if (!shouldCancel()) {
      await onDone();
    }
  } finally {
    setProgress(null);
  }
}

export async function queueSelectedAfterCurrent(
  store: Store,
  activePlayer: MediaPlayer,
  queueItems: MediaPlayerItem[],
  selectedIndices: Set<number>,
  setProgress: (p: OperationProgress | null) => void,
  shouldCancel: () => boolean,
  onDone: () => Promise<void>,
) {
  const queuePosition = activePlayer.attributes.queue_position;
  const currentIndex = queuePosition ? queuePosition - 1 : -1;
  const indices = Array.from(selectedIndices)
    .filter((i) => i !== currentIndex)
    .sort((a, b) => a - b);
  if (indices.length === 0) {
    return;
  }
  const total = indices.length;
  setProgress({ current: 0, total, label: 'Moving' });
  try {
    await store.mediaControlService.moveQueueItemsAfterCurrent(
      activePlayer,
      queueItems,
      indices,
      currentIndex,
      (completed) => setProgress({ current: completed, total, label: 'Moving' }),
      shouldCancel,
    );
    if (!shouldCancel()) {
      await onDone();
    }
  } finally {
    setProgress(null);
  }
}

export async function playSelected(
  store: Store,
  activePlayer: MediaPlayer,
  queueItems: MediaPlayerItem[],
  selectedIndices: Set<number>,
  setProgress: (p: OperationProgress | null) => void,
  shouldCancel: () => boolean,
  onDone: () => Promise<void>,
) {
  const indices = Array.from(selectedIndices).sort((a, b) => a - b);
  if (indices.length === 0) {
    return;
  }
  const items = indices.map((i) => queueItems[i]).filter((item) => item?.media_content_id);
  if (items.length === 0) {
    return;
  }
  const total = items.length;
  setProgress({ current: 0, total, label: 'Loading' });
  try {
    await store.mediaControlService.queueAndPlay(
      activePlayer,
      items,
      'replace',
      (completed) => setProgress({ current: completed, total, label: 'Loading' }),
      shouldCancel,
    );
    if (!shouldCancel()) {
      await onDone();
    }
  } finally {
    setProgress(null);
  }
}

export async function deleteSelected(
  store: Store,
  activePlayer: MediaPlayer,
  queueItems: MediaPlayerItem[],
  selectedIndices: Set<number>,
  setProgress: (p: OperationProgress | null) => void,
  shouldCancel: () => boolean,
  onDone: () => Promise<void>,
) {
  if (selectedIndices.size === queueItems.length) {
    await store.hassService.clearQueue(activePlayer);
    await onDone();
    return;
  }
  const indices = [...selectedIndices].sort((a, b) => a - b);
  const total = indices.length;
  setProgress({ current: 0, total, label: 'Deleting' });
  try {
    let deleted = 0;
    let remaining = [...indices];
    while (remaining.length > 0 && !shouldCancel()) {
      const batch = getParallelBatch(remaining);
      const results = await Promise.allSettled(batch.map((index) => store.hassService.removeFromQueue(activePlayer, index)));
      const succeededIndices = batch.filter((_, i) => results[i].status === 'fulfilled');
      deleted += succeededIndices.length;
      setProgress({ current: deleted, total, label: 'Deleting' });
      if (succeededIndices.length === 0) {
        console.error('All deletions in batch failed, aborting');
        break;
      }
      remaining = recalculateIndices(remaining, succeededIndices);
    }
  } finally {
    setProgress(null);
    await onDone();
  }
}

function getParallelBatch(sortedIndices: number[]): number[] {
  const MAX_PARALLEL = 50;
  const chunk: number[] = [sortedIndices[0]];
  for (let i = 1; i < sortedIndices.length; i++) {
    if (sortedIndices[i] === sortedIndices[i - 1] + 1) {
      chunk.push(sortedIndices[i]);
    } else {
      break;
    }
  }
  const halfSize = Math.min(MAX_PARALLEL, Math.max(1, Math.floor(chunk.length / 2)));
  return chunk.slice(0, halfSize);
}

function recalculateIndices(remaining: number[], deleted: number[]): number[] {
  const deletedSet = new Set(deleted);
  const maxDeleted = Math.max(...deleted);
  const deleteCount = deleted.length;
  return remaining.filter((i) => !deletedSet.has(i)).map((i) => (i > maxDeleted ? i - deleteCount : i));
}
