import { html, LitElement, nothing, PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import Store from '../../model/store';
import { MediaPlayer } from '../../model/media-player';
import { listStyle, MEDIA_ITEM_SELECTED } from '../../constants';
import { customEvent, delay } from '../../utils/utils';
import { clearSelection, invertSelection, updateSelection } from '../../utils/selection-utils';
import { getParallelBatch, recalculateIndicesAfterDeletion } from '../../utils/batch-operation-utils';
import { mdiCheckboxMultipleMarkedOutline, mdiCloseBoxMultipleOutline, mdiTrashCanOutline } from '@mdi/js';
import '../../components/media-row';
import './queue-search';
import '../../components/selection-actions';
import '../../components/operation-overlay';
import '../../components/play-menu';
import { MASS_QUEUE_NOT_INSTALLED, MediaPlayerItem, OperationProgress, QueueSearchMatch } from '../../types';
import type { PlayMenuAction } from '../../components/play-menu';
import type { EnqueueMode } from '../../services/music-assistant-service';
import { queueStyles } from './styles';

export class Queue extends LitElement {
  @property() store!: Store;
  @state() activePlayer!: MediaPlayer;
  @state() selectMode = false;
  @state() private searchExpanded = false;
  @state() private searchHighlightIndex = -1;
  @state() private searchMatchIndices: number[] = [];
  @state() private showOnlyMatches = false;
  @state() private shownIndices: number[] = [];
  @state() private selectedIndices = new Set<number>();
  @state() private queueItems: MediaPlayerItem[] = [];
  @state() private loading = true;
  @state() private operationProgress: OperationProgress | null = null;
  @state() private cancelOperation = false;
  @state() private errorMessage: string | null = null;
  @state() private currentQueueItemId: string | null = null;
  @state() private playMenuItemIndex: number | null = null;
  private lastQueueHash = '';
  private fetchDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private lastActivePlayerId: string | null = null;

  private get queueTitle(): string {
    if (this.store.config.queue?.title) {
      return this.store.config.queue.title;
    }
    const playlist = this.activePlayer.attributes.media_playlist ?? 'Play Queue';
    return this.activePlayer.attributes.media_channel ? `${playlist} (not active)` : playlist;
  }

  private async scrollToCurrentlyPlaying() {
    // Wait for LitElement to complete render, then scroll to the selected (currently playing) row
    await this.updateComplete;
    await new Promise((r) => requestAnimationFrame(r));
    const currentIndex = this.getCurrentlyPlayingIndex();
    if (currentIndex < 0) {
      return;
    }
    const rows = this.shadowRoot?.querySelectorAll('sonos-media-row');
    const selectedRow = rows?.[currentIndex];
    selectedRow?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  protected willUpdate(changedProperties: PropertyValues): void {
    if (changedProperties.has('store')) {
      // Debounce queue fetches to reduce flickering
      const playerChanged = this.store.activePlayer.id !== this.lastActivePlayerId;
      if (playerChanged) {
        this.lastActivePlayerId = this.store.activePlayer.id;
        this.lastQueueHash = '';
        this.loading = true;
        this.fetchQueue();
      } else {
        this.debouncedFetchQueue();
      }
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.fetchDebounceTimer) {
      clearTimeout(this.fetchDebounceTimer);
    }
  }

  private debouncedFetchQueue() {
    if (this.fetchDebounceTimer) {
      clearTimeout(this.fetchDebounceTimer);
    }
    this.fetchDebounceTimer = setTimeout(() => {
      this.fetchQueue();
    }, 500);
  }

  private async fetchQueue(forceRefresh = false) {
    try {
      const [queue, currentItemId] = await Promise.all([
        this.store.hassService.getQueue(this.store.activePlayer),
        this.store.hassService.musicAssistantService.getCurrentQueueItemId(this.store.activePlayer),
      ]);
      const queueHash = queue.map((item) => item.title).join('|');
      if (forceRefresh || queueHash !== this.lastQueueHash) {
        this.lastQueueHash = queueHash;
        this.queueItems = queue;
      }
      if (currentItemId !== this.currentQueueItemId) {
        this.currentQueueItemId = currentItemId;
      }
      if (this.errorMessage !== null) {
        this.errorMessage = null;
      }
    } catch (e) {
      const error = e as Error;
      if (error.message === MASS_QUEUE_NOT_INSTALLED) {
        this.errorMessage =
          'To show the queue for Music Assistant, install the mass_queue integration from HACS: github.com/droans/mass_queue';
        this.queueItems = [];
      } else {
        // Keep cached queue on other errors
        console.warn('Error getting queue', e);
      }
    }
    if (this.loading) {
      this.loading = false;
    }
  }

  render() {
    this.activePlayer = this.store.activePlayer;

    if (this.shouldShowMusicAssistantConfigMessage()) {
      return html`
        <div class="queue-container">
          <div class="error-message">
            <p>
              To see the Music Assistant queue, enable <code>useMusicAssistant</code> (or set
              <code>entityPlatform: music_assistant</code>) in the card configuration.
            </p>
          </div>
        </div>
      `;
    }

    if (this.isQueueNotManagedByMusicAssistant()) {
      return html`
        <div class="queue-container">
          <div class="error-message">
            <p>The current queue is not managed by Music Assistant.</p>
          </div>
        </div>
      `;
    }

    const selected = this.getCurrentlyPlayingIndex();
    return html`
      <div class="queue-container" @keydown=${this.onKeyDown} tabindex="-1">
        <sonos-operation-overlay
          .progress=${this.operationProgress}
          .hass=${this.store.hass}
          @cancel-operation=${this.cancelCurrentOperation}
        ></sonos-operation-overlay>
        ${this.errorMessage ? this.renderError() : this.renderQueue(selected)} ${this.renderPlayMenuOverlay()}
      </div>
    `;
  }

  private shouldShowMusicAssistantConfigMessage(): boolean {
    return (
      this.store.config.entityPlatform !== 'music_assistant' &&
      this.activePlayer.attributes.media_playlist === 'Music Assistant'
    );
  }

  private isQueueNotManagedByMusicAssistant(): boolean {
    return this.store.config.entityPlatform === 'music_assistant' && this.activePlayer.attributes.active_queue == null;
  }

  private getCurrentlyPlayingIndex(): number {
    const attrs = this.activePlayer.attributes;
    // Sonos uses queue_position (1-based)
    if (attrs.queue_position) {
      return attrs.queue_position - 1;
    }
    // Music Assistant: match by queue_item_id from music_assistant.get_queue
    if (this.currentQueueItemId) {
      const index = this.queueItems.findIndex((item) => item.queueItemId === this.currentQueueItemId);
      if (index !== -1) {
        return index;
      }
    }
    return -1;
  }

  private renderError() {
    return html`
      <div class="error-message">
        <p>${this.errorMessage}</p>
      </div>
    `;
  }

  private renderQueue(selected: number) {
    const hasSelection = this.selectedIndices.size > 0;
    // If showOnlyMatches is enabled, filter queueItems and map indices
    const displayItems = this.showOnlyMatches ? this.shownIndices.map((i) => this.queueItems[i]) : this.queueItems;
    const indexMap = this.showOnlyMatches ? this.shownIndices : null;
    const itemCount = this.queueItems.length;
    return html`
      <div class="header">
        <div class="title-container">
          <span class="title">${this.queueTitle}</span>
          ${itemCount > 0 ? html`<span class="item-count">(${itemCount} items)</span>` : ''}
        </div>
        <div class="header-icons">
          <sonos-queue-search
            .items=${this.queueItems}
            .selectMode=${this.selectMode}
            @queue-search-match=${this.onSearchMatch}
            @queue-search-select-all=${this.onSelectAllMatches}
            @queue-search-expanded=${this.onSearchExpanded}
            @queue-search-show-only-matches=${this.onShowOnlyMatches}
          ></sonos-queue-search>
          ${this.selectMode
            ? html`
                <sonos-selection-actions
                  .hasSelection=${hasSelection}
                  .disabled=${this.operationProgress !== null}
                  @invert-selection=${this.handleInvertSelection}
                  @play-selected=${this.playSelected}
                  @queue-selected=${this.queueSelectedAfterCurrent}
                  @queue-selected-at-end=${this.queueSelectedAtEnd}
                ></sonos-selection-actions>
                ${hasSelection
                  ? html`<ha-icon-button
                      .path=${mdiCloseBoxMultipleOutline}
                      @click=${this.deleteSelected}
                      title="Delete selected"
                    ></ha-icon-button>`
                  : nothing}
                <div class="delete-all-btn" @click=${this.clearQueue} title="Delete all">
                  <ha-icon-button .path=${mdiTrashCanOutline}></ha-icon-button>
                  <span class="all-label">*</span>
                </div>
              `
            : html`
                <sonos-shuffle .store=${this.store}></sonos-shuffle>
                <sonos-repeat .store=${this.store}></sonos-repeat>
              `}
          <ha-icon-button
            .path=${mdiCheckboxMultipleMarkedOutline}
            @click=${this.toggleSelectMode}
            ?selected=${this.selectMode}
            title="Select mode"
            ?disabled=${this.operationProgress !== null}
          ></ha-icon-button>
        </div>
      </div>
      <div class="list ${this.searchExpanded ? 'search-active' : ''}">
        ${this.loading
          ? html`<div class="loading"><ha-spinner></ha-spinner></div>`
          : html`<mwc-list multi>
              ${displayItems.map((item, index) => {
                // Map index to real index in queueItems if filtering
                const realIndex = indexMap ? indexMap[index] : index;
                const isSelected = selected >= 0 && realIndex === selected;
                const isPlaying = isSelected && this.activePlayer.isPlaying();
                const isSearchHighlight = this.searchHighlightIndex === realIndex;
                const isChecked = this.selectedIndices.has(realIndex);
                return html`
                  <sonos-media-row
                    @click=${() => this.onMediaItemClick(index)}
                    .item=${item}
                    .selected=${isSelected}
                    .playing=${isPlaying}
                    .searchHighlight=${isSearchHighlight}
                    .showCheckbox=${this.selectMode}
                    .checked=${isChecked}
                    @checkbox-change=${(e: CustomEvent) => this.onCheckboxChange(realIndex, e.detail.checked)}
                    .store=${this.store}
                  ></sonos-media-row>
                `;
              })}
            </mwc-list>`}
      </div>
    `;
  }

  private renderPlayMenuOverlay() {
    if (this.playMenuItemIndex === null) {
      return nothing;
    }
    const realIndex = this.playMenuItemIndex;
    return html`
      <div class="play-menu-overlay" @click=${() => (this.playMenuItemIndex = null)}>
        <sonos-play-menu
          .hasSelection=${true}
          .inline=${true}
          @play-menu-action=${(e: CustomEvent) => this.handleItemPlayAction(realIndex, e)}
          @play-menu-close=${() => (this.playMenuItemIndex = null)}
        ></sonos-play-menu>
      </div>
    `;
  }

  private async runBatchOperation(
    operation: (onProgress: (completed: number) => void, shouldCancel: () => boolean) => Promise<void>,
    options: { scrollToPlaying?: boolean } = {},
  ) {
    this.cancelOperation = false;
    try {
      await operation(
        (completed) => {
          this.operationProgress = { ...this.operationProgress!, current: completed };
        },
        () => this.cancelOperation,
      );
      if (this.cancelOperation) {
        return;
      }
      this.exitSelectMode();
      await delay(500);
      await this.fetchQueue(true);
      if (options.scrollToPlaying) {
        await this.scrollToCurrentlyPlaying();
      }
    } finally {
      this.operationProgress = null;
      this.cancelOperation = false;
    }
  }

  private getSelectedIndicesExcludingCurrent(): number[] {
    const currentIndex = this.getCurrentlyPlayingIndex();
    return Array.from(this.selectedIndices)
      .filter((i) => i !== currentIndex)
      .sort((a, b) => a - b);
  }

  private async queueSelectedAfterCurrent() {
    const selectedIndices = this.getSelectedIndicesExcludingCurrent();
    if (selectedIndices.length === 0) {
      return;
    }

    const total = selectedIndices.length;
    const currentIndex = this.getCurrentlyPlayingIndex();
    this.operationProgress = { current: 0, total, label: 'Moving' };

    await this.runBatchOperation(
      (onProgress, shouldCancel) =>
        this.store.mediaControlService.moveQueueItemsAfterCurrent(
          this.activePlayer,
          this.queueItems,
          selectedIndices,
          currentIndex,
          onProgress,
          shouldCancel,
        ),
      { scrollToPlaying: true },
    );
  }

  private async queueSelectedAtEnd() {
    const selectedIndices = this.getSelectedIndicesExcludingCurrent();
    if (selectedIndices.length === 0) {
      return;
    }

    const total = selectedIndices.length;
    this.operationProgress = { current: 0, total, label: 'Moving' };

    await this.runBatchOperation((onProgress, shouldCancel) =>
      this.store.mediaControlService.moveQueueItemsToEnd(
        this.activePlayer,
        this.queueItems,
        selectedIndices,
        onProgress,
        shouldCancel,
      ),
    );
  }

  private async playSelected() {
    const selectedIndices = Array.from(this.selectedIndices).sort((a, b) => a - b);
    if (selectedIndices.length === 0) {
      return;
    }

    const items = selectedIndices.map((i) => this.queueItems[i]).filter((item) => item?.media_content_id);
    if (items.length === 0) {
      return;
    }

    const total = items.length;
    this.operationProgress = { current: 0, total, label: 'Loading' };

    await this.runBatchOperation(
      (onProgress, shouldCancel) =>
        this.store.mediaControlService.queueAndPlay(this.activePlayer, items, 'replace', onProgress, shouldCancel),
      { scrollToPlaying: true },
    );
  }

  private onSearchMatch(e: CustomEvent<QueueSearchMatch>) {
    this.searchHighlightIndex = e.detail.index;
    this.searchMatchIndices = e.detail.matchIndices ?? [];
  }

  private onShowOnlyMatches(e: CustomEvent<{ showOnlyMatches: boolean; shownIndices: number[] }>) {
    this.showOnlyMatches = e.detail.showOnlyMatches;
    this.shownIndices = e.detail.shownIndices;
  }

  private onSearchExpanded(e: CustomEvent<{ expanded: boolean }>) {
    this.searchExpanded = e.detail.expanded;
  }

  private onSelectAllMatches() {
    this.selectedIndices = new Set([...this.selectedIndices, ...this.searchMatchIndices]);
  }

  private handleInvertSelection() {
    this.selectedIndices = invertSelection(this.selectedIndices, this.queueItems.length);
  }

  private onMediaItemClick = async (index: number) => {
    let realIndex = index;
    if (this.showOnlyMatches && this.shownIndices.length > 0) {
      realIndex = this.shownIndices[index];
    }
    if (this.selectMode) {
      // In select mode, toggle checkbox
      const isChecked = this.selectedIndices.has(realIndex);
      this.selectedIndices = updateSelection(this.selectedIndices, realIndex, !isChecked);
      return;
    }
    // Show/toggle inline play menu
    this.playMenuItemIndex = this.playMenuItemIndex === realIndex ? null : realIndex;
  };

  private async handleItemPlayAction(realIndex: number, e: CustomEvent<PlayMenuAction>) {
    const item = this.queueItems[realIndex];
    if (!item?.media_content_id) {
      return;
    }
    this.playMenuItemIndex = null;
    const action = e.detail;
    const enqueue = action.enqueue;
    // mediaControlService.playMedia only supports add/next/replace/play
    // For replace_next or radioMode, use musicAssistantService directly
    if (enqueue === 'replace_next' || action.radioMode) {
      await this.store.hassService.musicAssistantService.playMedia(
        this.store.activePlayer,
        item.media_content_id,
        enqueue as EnqueueMode,
        action.radioMode,
      );
    } else {
      const playMode = enqueue as 'add' | 'next' | 'replace' | 'play';
      await this.store.mediaControlService.playMedia(this.store.activePlayer, item, playMode);
    }
    this.dispatchEvent(customEvent(MEDIA_ITEM_SELECTED));
  }

  private onCheckboxChange(index: number, checked: boolean) {
    this.selectedIndices = updateSelection(this.selectedIndices, index, checked);
  }

  private onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      if (this.playMenuItemIndex !== null) {
        this.playMenuItemIndex = null;
      } else if (this.selectMode) {
        this.exitSelectMode();
      }
    }
  }

  private toggleSelectMode() {
    if (this.selectMode) {
      this.exitSelectMode();
    } else {
      this.selectMode = true;
      this.selectedIndices = clearSelection();
      this.playMenuItemIndex = null;
    }
  }

  private exitSelectMode() {
    this.selectMode = false;
    this.selectedIndices = clearSelection();
    this.playMenuItemIndex = null;
  }

  private cancelCurrentOperation() {
    this.cancelOperation = true;
  }

  private async clearQueue() {
    await this.store.hassService.clearQueue(this.activePlayer);
    this.exitSelectMode();
    await delay(500);
    await this.fetchQueue(true);
  }

  private async deleteSelected() {
    // If all items are selected, use clear queue (much faster)
    if (this.selectedIndices.size === this.queueItems.length) {
      await this.clearQueue();
      return;
    }

    const indices = [...this.selectedIndices].sort((a, b) => a - b); // Sort ascending
    const total = indices.length;

    this.operationProgress = { current: 0, total, label: 'Deleting' };
    this.cancelOperation = false;

    try {
      let deleted = 0;
      let remaining = [...indices];

      while (remaining.length > 0 && !this.cancelOperation) {
        // Find contiguous chunks and delete first half of each in parallel
        const batch = getParallelBatch(remaining);

        const results = await Promise.allSettled(
          batch.map((index) => {
            const queueItemId = this.queueItems[index]?.queueItemId;
            return this.store.hassService.removeFromQueue(this.activePlayer, index, queueItemId);
          }),
        );

        // Track which specific indices succeeded
        const succeededIndices = batch.filter((_, i) => results[i].status === 'fulfilled');
        deleted += succeededIndices.length;
        this.operationProgress = { current: deleted, total, label: 'Deleting' };

        // If all failed, break to avoid infinite loop
        if (succeededIndices.length === 0) {
          console.error('All deletions in batch failed, aborting');
          break;
        }

        // Recalculate remaining indices based on which ones actually succeeded
        remaining = recalculateIndicesAfterDeletion(remaining, succeededIndices);
      }
    } finally {
      this.operationProgress = null;
      this.cancelOperation = false;
      this.exitSelectMode();
      // Wait for Music Assistant to process the deletion before refreshing
      await delay(500);
      await this.fetchQueue(true);
    }
  }

  static get styles() {
    return [listStyle, ...queueStyles];
  }
}
