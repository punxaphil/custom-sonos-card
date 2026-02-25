import { MEDIA_ITEM_SELECTED } from '../../constants';
import { customEvent } from '../../utils/utils';
import { clearSelection, invertSelection, updateSelection } from '../../utils/selection-utils';
import { clearQueue, deleteSelected, handleItemPlayAction, playSelected, queueSelectedAfterCurrent, queueSelectedAtEnd } from './queue-operations-utils';
import { applyQueueSearchAction, resolveQueueItemIndex, shouldSwitchToPlayerSection } from './queue-section-utils';
import type { QueueController } from './queue-controller';
import type { QueueHeaderAction, QueueListAction, QueueSearchAction } from './queue.types';
import type { PlayMenuAction } from '../../types';

export function handleSearchAction(ctrl: QueueController, action: QueueSearchAction): void {
  Object.assign(ctrl, applyQueueSearchAction(action, ctrl.searchMatchIndices, ctrl.selectedIndices));
  ctrl.requestUpdate();
}

const headerActions: Record<QueueHeaderAction['type'], (ctrl: QueueController) => void> = {
  'toggle-select-mode': toggleSelectMode,
  'invert-selection': (ctrl) => {
    ctrl.selectedIndices = invertSelection(ctrl.selectedIndices, ctrl.queueItems.length);
    ctrl.requestUpdate();
  },
  'play-selected': (ctrl) => void playSelected(ctrl),
  'queue-selected-after-current': (ctrl) => void queueSelectedAfterCurrent(ctrl),
  'queue-selected-at-end': (ctrl) => void queueSelectedAtEnd(ctrl),
  'delete-selected': (ctrl) => void deleteSelected(ctrl),
  'clear-queue': (ctrl) => void clearQueue(ctrl),
};

export function handleHeaderAction(ctrl: QueueController, action: QueueHeaderAction): void {
  headerActions[action.type](ctrl);
}

export function handleListAction(ctrl: QueueController, action: QueueListAction): void {
  if (action.type === 'checkbox-change') {
    ctrl.selectedIndices = updateSelection(ctrl.selectedIndices, action.payload.realIndex, action.payload.checked);
    ctrl.requestUpdate();
    return;
  }
  const realIndex = resolveQueueItemIndex(action.payload.displayIndex, ctrl.showOnlyMatches, ctrl.shownIndices);
  if (ctrl.selectMode) {
    ctrl.selectedIndices = updateSelection(ctrl.selectedIndices, realIndex, !ctrl.selectedIndices.has(realIndex));
    ctrl.requestUpdate();
    return;
  }
  ctrl.playMenuItemIndex = ctrl.playMenuItemIndex === realIndex ? null : realIndex;
  ctrl.requestUpdate();
}

export async function handlePlayMenuAction(ctrl: QueueController, action: PlayMenuAction): Promise<void> {
  if (ctrl.playMenuItemIndex === null) {
    return;
  }
  const itemIndex = ctrl.playMenuItemIndex;
  ctrl.playMenuItemIndex = null;
  await handleItemPlayAction(ctrl, itemIndex, action);
  if (shouldSwitchToPlayerSection(action)) {
    ctrl.dispatchEvent(customEvent(MEDIA_ITEM_SELECTED));
  }
  ctrl.requestUpdate();
}

export function handleKeyDown(ctrl: QueueController, key: string): void {
  if (key !== 'Escape') {
    return;
  }
  if (ctrl.playMenuItemIndex !== null) {
    ctrl.playMenuItemIndex = null;
    ctrl.requestUpdate();
  } else if (ctrl.selectMode) {
    ctrl.exitSelectMode();
  }
}

export function cancelCurrentOperation(ctrl: QueueController): void {
  ctrl.cancelOperation = true;
  ctrl.requestUpdate();
}

export function dismissPlayMenu(ctrl: QueueController): void {
  ctrl.playMenuItemIndex = null;
  ctrl.requestUpdate();
}

function toggleSelectMode(ctrl: QueueController): void {
  if (ctrl.selectMode) {
    ctrl.exitSelectMode();
  } else {
    ctrl.selectMode = true;
    ctrl.selectedIndices = clearSelection();
    ctrl.playMenuItemIndex = null;
    ctrl.requestUpdate();
  }
}
