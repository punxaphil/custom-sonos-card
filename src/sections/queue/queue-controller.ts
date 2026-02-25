import type { ReactiveController, ReactiveControllerHost } from 'lit';
import type Store from '../../model/store';
import type { MediaPlayer } from '../../model/media-player';
import type { MediaPlayerItem, OperationProgress } from '../../types';
import { MASS_QUEUE_NOT_INSTALLED } from '../../types';
import type { QueueFetchResult, QueueHost } from './queue.types';
import { clearSelection } from '../../utils/selection-utils';
import {
  fetchQueueData,
  getDisplayItems,
  getQueueTitle,
  getSelectedQueueIndex,
  MASS_QUEUE_INSTALL_MESSAGE,
  QUEUE_DEBOUNCE_MS,
  queueNotManagedByMusicAssistant,
  shouldShowConfigMessage,
} from './queue-section-utils';

export class QueueController implements ReactiveController {
  activePlayer!: MediaPlayer;
  selectMode = false;
  searchExpanded = false;
  searchHighlightIndex = -1;
  searchMatchIndices: number[] = [];
  showOnlyMatches = false;
  shownIndices: number[] = [];
  selectedIndices = new Set<number>();
  queueItems: MediaPlayerItem[] = [];
  loading = true;
  operationProgress: OperationProgress | null = null;
  cancelOperation = false;
  errorMessage: string | null = null;
  currentQueueItemId: string | null = null;
  playMenuItemIndex: number | null = null;
  lastQueueHash = '';
  private fetchDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private lastActivePlayerId: string | null = null;
  private lastStoreRef: Store | null = null;

  constructor(
    private host: QueueHost,
    private getStore: () => Store,
  ) {
    host.addController(this);
  }

  get store(): Store {
    return this.getStore();
  }

  requestUpdate(): void {
    this.host.requestUpdate();
  }

  dispatchEvent(event: Event): boolean {
    return this.host.dispatchEvent(event);
  }

  async scrollToCurrentlyPlaying(): Promise<void> {
    await (this.host as ReactiveControllerHost).updateComplete;
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const row = this.host.shadowRoot?.querySelectorAll('sonos-media-row')[this.selectedQueueIndex];
    row?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  async fetchQueue(forceRefresh = false): Promise<void> {
    try {
      this.applyFetchResult(await fetchQueueData(this.store, this.store.activePlayer, forceRefresh, this.lastQueueHash));
    } catch (error) {
      this.handleFetchError(error as Error);
    }
    if (this.loading) {
      this.loading = false;
    }
    this.host.requestUpdate();
  }

  exitSelectMode(): void {
    this.selectMode = false;
    this.selectedIndices = clearSelection();
    this.playMenuItemIndex = null;
    this.host.requestUpdate();
  }

  get queueTitle(): string {
    return getQueueTitle(this.store, this.activePlayer);
  }

  get selectedQueueIndex(): number {
    return getSelectedQueueIndex(this.activePlayer, this.currentQueueItemId, this.queueItems);
  }

  get displayItems(): MediaPlayerItem[] {
    return getDisplayItems(this.showOnlyMatches, this.shownIndices, this.queueItems);
  }

  get showConfigMessage(): boolean {
    return shouldShowConfigMessage(this.store, this.activePlayer);
  }

  get showQueueMessage(): boolean {
    return queueNotManagedByMusicAssistant(this.store, this.activePlayer);
  }

  get hasError(): boolean {
    return this.showConfigMessage || this.showQueueMessage || !!this.errorMessage;
  }

  hostUpdate(): void {
    const store = this.getStore();
    if (!store || store === this.lastStoreRef) {
      return;
    }
    this.lastStoreRef = store;
    this.activePlayer = store.activePlayer;

    const playerChanged = store.activePlayer.id !== this.lastActivePlayerId;
    if (playerChanged) {
      this.lastActivePlayerId = store.activePlayer.id;
      this.lastQueueHash = '';
      this.loading = true;
      void this.fetchQueue();
      return;
    }
    if (this.fetchDebounceTimer) {
      clearTimeout(this.fetchDebounceTimer);
    }
    this.fetchDebounceTimer = setTimeout(() => void this.fetchQueue(), QUEUE_DEBOUNCE_MS);
  }

  hostDisconnected(): void {
    if (this.fetchDebounceTimer) {
      clearTimeout(this.fetchDebounceTimer);
    }
  }

  private applyFetchResult(result: QueueFetchResult): void {
    if (result.queueHash !== undefined) {
      this.lastQueueHash = result.queueHash;
    }
    if (result.queueItems !== undefined) {
      this.queueItems = result.queueItems;
    }
    if (result.currentQueueItemId !== undefined) {
      this.currentQueueItemId = result.currentQueueItemId;
    }
    if (result.clearError && this.errorMessage !== null) {
      this.errorMessage = null;
    }
  }

  private handleFetchError(error: Error): void {
    if (error.message === MASS_QUEUE_NOT_INSTALLED) {
      this.errorMessage = MASS_QUEUE_INSTALL_MESSAGE;
      this.queueItems = [];
    } else {
      console.warn('Error getting queue', error);
    }
  }
}
