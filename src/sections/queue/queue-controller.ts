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
  queueItemsEqual,
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
  private fetchDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private fetchGeneration = 0;
  private lifecycleFetches = new Map<string, { queued: boolean }>();
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
    const generation = ++this.fetchGeneration;
    const activePlayer = this.store.activePlayer;
    try {
      const result = await fetchQueueData(this.store, activePlayer);
      if (!this.isCurrentFetch(generation, activePlayer.id)) {
        return;
      }
      this.applyFetchResult(result, forceRefresh);
    } catch (error) {
      if (!this.isCurrentFetch(generation, activePlayer.id)) {
        return;
      }
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
      if (this.fetchDebounceTimer) {
        clearTimeout(this.fetchDebounceTimer);
        this.fetchDebounceTimer = null;
      }
      this.lastActivePlayerId = store.activePlayer.id;
      this.loading = true;
      this.requestLifecycleFetch();
      return;
    }
    if (this.fetchDebounceTimer) {
      return;
    }
    this.fetchDebounceTimer = setTimeout(() => {
      this.fetchDebounceTimer = null;
      this.requestLifecycleFetch();
    }, QUEUE_DEBOUNCE_MS);
  }

  hostDisconnected(): void {
    this.fetchGeneration++;
    for (const state of this.lifecycleFetches.values()) {
      state.queued = false;
    }
    this.lifecycleFetches.clear();
    if (this.fetchDebounceTimer) {
      clearTimeout(this.fetchDebounceTimer);
      this.fetchDebounceTimer = null;
    }
  }

  private requestLifecycleFetch(): void {
    const playerId = this.store.activePlayer.id;
    const pending = this.lifecycleFetches.get(playerId);
    if (pending) {
      pending.queued = true;
      return;
    }
    const state = { queued: false };
    this.lifecycleFetches.set(playerId, state);
    void (async () => {
      try {
        do {
          state.queued = false;
          await this.fetchQueue();
        } while (state.queued && this.store.activePlayer.id === playerId);
      } finally {
        if (this.lifecycleFetches.get(playerId) === state) {
          this.lifecycleFetches.delete(playerId);
        }
      }
    })();
  }

  private isCurrentFetch(generation: number, playerId: string): boolean {
    return generation === this.fetchGeneration && playerId === this.store.activePlayer.id;
  }

  private applyFetchResult(result: QueueFetchResult, forceRefresh: boolean): void {
    if (result.queueItems !== undefined && (forceRefresh || !queueItemsEqual(this.queueItems, result.queueItems))) {
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
