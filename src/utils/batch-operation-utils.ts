import { BatchOperationCallbacks, BatchOperationFn, MediaPlayerItem, OperationProgress } from '../types';

/**
 * Execute a batch operation with progress tracking and cancellation support.
 * Handles the common try/finally pattern for batch operations.
 */
export async function executeBatchOperation(
  operation: BatchOperationFn,
  state: { cancelOperation: boolean },
  callbacks: BatchOperationCallbacks,
): Promise<boolean> {
  state.cancelOperation = false;
  try {
    await operation(
      (completed) => {
        // Update just the current value, preserving total and label
        const currentProgress = callbacks.setProgress as unknown as { current?: OperationProgress | null };
        if (currentProgress.current) {
          callbacks.setProgress({ ...currentProgress.current, current: completed });
        }
      },
      () => state.cancelOperation,
    );
    if (!state.cancelOperation) {
      callbacks.onComplete?.();
      return true;
    }
    return false;
  } finally {
    callbacks.setProgress(null);
    state.cancelOperation = false;
  }
}

/**
 * Queue items after the currently playing track.
 * Items are added in reverse order so they appear in the correct sequence.
 */
export async function queueItemsAfterCurrent<T extends MediaPlayerItem>(
  items: T[],
  playMedia: (item: T, enqueue: 'next') => Promise<void>,
  onProgress: (completed: number) => void,
  shouldCancel: () => boolean,
): Promise<void> {
  const total = items.length;
  for (let i = items.length - 1; i >= 0; i--) {
    if (shouldCancel()) {
      return;
    }
    await playMedia(items[i], 'next');
    onProgress(total - i);
  }
}

/**
 * Queue items at the end of the queue.
 * Items are added in order.
 */
export async function queueItemsAtEnd<T extends MediaPlayerItem>(
  items: T[],
  playMedia: (item: T, enqueue: 'add') => Promise<void>,
  onProgress: (completed: number) => void,
  shouldCancel: () => boolean,
): Promise<void> {
  for (let i = 0; i < items.length; i++) {
    if (shouldCancel()) {
      return;
    }
    await playMedia(items[i], 'add');
    onProgress(i + 1);
  }
}

/**
 * Get a batch of contiguous indices for parallel processing.
 * Returns the first half of the first contiguous chunk (for safe parallel deletion).
 */
export function getParallelBatch(sortedIndices: number[], maxParallel = 50): number[] {
  if (sortedIndices.length === 0) {
    return [];
  }

  // Find first contiguous chunk
  const chunk: number[] = [sortedIndices[0]];
  for (let i = 1; i < sortedIndices.length; i++) {
    if (sortedIndices[i] === sortedIndices[i - 1] + 1) {
      chunk.push(sortedIndices[i]);
    } else {
      break;
    }
  }
  // Return first half of the chunk (at least 1, max maxParallel)
  const halfSize = Math.min(maxParallel, Math.max(1, Math.floor(chunk.length / 2)));
  return chunk.slice(0, halfSize);
}

/**
 * Recalculate remaining indices after some have been deleted.
 * Adjusts indices that were after the deleted items.
 */
export function recalculateIndicesAfterDeletion(remaining: number[], deleted: number[]): number[] {
  if (deleted.length === 0) {
    return remaining;
  }

  const deletedSet = new Set(deleted);
  const maxDeleted = Math.max(...deleted);
  const deleteCount = deleted.length;

  return remaining.filter((i) => !deletedSet.has(i)).map((i) => (i > maxDeleted ? i - deleteCount : i));
}
