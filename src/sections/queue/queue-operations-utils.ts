import type { EnqueueMode, PlayMenuAction } from '../../types';
import { delay } from '../../utils/utils';
import { getParallelBatch, recalculateIndicesAfterDeletion } from '../../utils/batch-operation-utils';
import type { QueueController } from './queue-controller';

const QUEUE_REFRESH_DELAY_MS = 500;

function resetOperationState(ctrl: QueueController): void {
  ctrl.operationProgress = null;
  ctrl.cancelOperation = false;
  ctrl.requestUpdate();
}

async function refreshAfterOperation(ctrl: QueueController, scrollToPlaying = false): Promise<void> {
  ctrl.exitSelectMode();
  await delay(QUEUE_REFRESH_DELAY_MS);
  await ctrl.fetchQueue(true);
  if (scrollToPlaying) {
    await ctrl.scrollToCurrentlyPlaying();
  }
}

async function runBatchOperation(
  ctrl: QueueController,
  operation: (onProgress: (completed: number) => void, shouldCancel: () => boolean) => Promise<void>,
  options: { scrollToPlaying?: boolean } = {},
): Promise<void> {
  ctrl.cancelOperation = false;
  try {
    await operation(
      (completed) => {
        ctrl.operationProgress = { ...ctrl.operationProgress!, current: completed };
        ctrl.requestUpdate();
      },
      () => ctrl.cancelOperation,
    );
    if (!ctrl.cancelOperation) {
      await refreshAfterOperation(ctrl, options.scrollToPlaying);
    }
  } finally {
    resetOperationState(ctrl);
  }
}

function getSelectedIndicesExcludingCurrent(ctrl: QueueController): number[] {
  const currentIndex = ctrl.selectedQueueIndex;
  return Array.from(ctrl.selectedIndices)
    .filter((index) => index !== currentIndex)
    .sort((a, b) => a - b);
}

export async function queueSelectedAfterCurrent(ctrl: QueueController): Promise<void> {
  const selectedIndices = getSelectedIndicesExcludingCurrent(ctrl);
  if (selectedIndices.length === 0) {
    return;
  }
  ctrl.operationProgress = { current: 0, total: selectedIndices.length, label: 'Moving' };
  ctrl.requestUpdate();
  await runBatchOperation(
    ctrl,
    (onProgress, shouldCancel) =>
      ctrl.store.mediaControlService.moveQueueItemsAfterCurrent(
        ctrl.activePlayer,
        ctrl.queueItems,
        selectedIndices,
        ctrl.selectedQueueIndex,
        onProgress,
        shouldCancel,
      ),
    { scrollToPlaying: true },
  );
}

export async function queueSelectedAtEnd(ctrl: QueueController): Promise<void> {
  const selectedIndices = getSelectedIndicesExcludingCurrent(ctrl);
  if (selectedIndices.length === 0) {
    return;
  }
  ctrl.operationProgress = { current: 0, total: selectedIndices.length, label: 'Moving' };
  ctrl.requestUpdate();
  await runBatchOperation(ctrl, (onProgress, shouldCancel) =>
    ctrl.store.mediaControlService.moveQueueItemsToEnd(ctrl.activePlayer, ctrl.queueItems, selectedIndices, onProgress, shouldCancel),
  );
}

export async function playSelected(ctrl: QueueController): Promise<void> {
  const selectedIndices = Array.from(ctrl.selectedIndices).sort((a, b) => a - b);
  if (selectedIndices.length === 0) {
    return;
  }
  const items = selectedIndices.map((index) => ctrl.queueItems[index]).filter((item) => item?.media_content_id);
  if (items.length === 0) {
    return;
  }
  ctrl.operationProgress = { current: 0, total: items.length, label: 'Loading' };
  ctrl.requestUpdate();
  await runBatchOperation(
    ctrl,
    (onProgress, shouldCancel) => ctrl.store.mediaControlService.queueAndPlay(ctrl.activePlayer, items, 'replace', onProgress, shouldCancel),
    { scrollToPlaying: true },
  );
}

export async function handleItemPlayAction(ctrl: QueueController, itemIndex: number, action: PlayMenuAction): Promise<void> {
  const item = ctrl.queueItems[itemIndex];
  if (!item?.media_content_id) {
    return;
  }
  if (action.enqueue === 'replace_next' || action.radioMode) {
    await ctrl.store.hassService.musicAssistantService.playMedia(ctrl.activePlayer, item.media_content_id, action.enqueue as EnqueueMode, action.radioMode);
    return;
  }
  if (action.enqueue === 'play') {
    await ctrl.store.mediaControlService.playQueue(ctrl.activePlayer, itemIndex, item.queueItemId);
    return;
  }
  await ctrl.store.mediaControlService.playMedia(ctrl.activePlayer, item, action.enqueue as 'add' | 'next' | 'replace');
}

export async function clearQueue(ctrl: QueueController): Promise<void> {
  await ctrl.store.hassService.clearQueue(ctrl.activePlayer);
  ctrl.exitSelectMode();
  await delay(QUEUE_REFRESH_DELAY_MS);
  await ctrl.fetchQueue(true);
}

export async function deleteSelected(ctrl: QueueController): Promise<void> {
  if (ctrl.selectedIndices.size === ctrl.queueItems.length) {
    await clearQueue(ctrl);
    return;
  }
  const remaining = [...ctrl.selectedIndices].sort((a, b) => a - b);
  ctrl.operationProgress = { current: 0, total: remaining.length, label: 'Deleting' };
  ctrl.cancelOperation = false;
  ctrl.requestUpdate();
  try {
    await deleteBatch(ctrl, remaining);
  } finally {
    resetOperationState(ctrl);
    await refreshAfterOperation(ctrl);
  }
}

async function deleteBatch(ctrl: QueueController, remaining: number[]): Promise<void> {
  const total = remaining.length;
  let deleted = 0;
  let indices = remaining;
  while (indices.length > 0 && !ctrl.cancelOperation) {
    const batch = getParallelBatch(indices);
    const results = await Promise.allSettled(
      batch.map((index) => {
        const queueItemId = ctrl.queueItems[index]?.queueItemId;
        return ctrl.store.hassService.removeFromQueue(ctrl.activePlayer, index, queueItemId);
      }),
    );
    const succeededIndices = batch.filter((_, i) => results[i].status === 'fulfilled');
    deleted += succeededIndices.length;
    ctrl.operationProgress = { current: deleted, total, label: 'Deleting' };
    ctrl.requestUpdate();
    if (succeededIndices.length === 0) {
      break;
    }
    indices = recalculateIndicesAfterDeletion(indices, succeededIndices);
  }
}
