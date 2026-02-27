import { html, LitElement, PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import Store from '../../model/store';
import { listStyle, MEDIA_ITEM_SELECTED } from '../../constants';
import { customEvent } from '../../utils/utils';
import '../../components/operation-overlay';
import './queue-header';
import './queue-list';
import type { MediaPlayerItem, OperationProgress } from '../../types';
import type { QueueHeaderAction, QueueListAction, QueueSearchAction } from './queue.types';
import type { QueueList } from './queue-list';
import { clearSelection, invertSelection, updateSelection } from '../../utils/selection-utils';
import { queueStyles } from './styles';
import { queueAfterCurrent, queueSelectedAfterCurrent, playSelected, deleteSelected } from './queue-sonos-utils';

export class QueueSonos extends LitElement {
  @property() store!: Store;
  @state() selectMode = false;
  @state() private searchExpanded = false;
  @state() private searchHighlightIndex = -1;
  @state() private showOnlyMatches = false;
  @state() private shownIndices: number[] = [];
  @state() private selectedIndices = new Set<number>();
  @state() private queueItems: MediaPlayerItem[] = [];
  @state() private loading = true;
  @state() private operationProgress: OperationProgress | null = null;
  @state() private cancelOperation = false;
  private lastQueueHash = '';

  private get queueTitle(): string {
    if (this.store.config.queue?.title) {
      return this.store.config.queue.title;
    }
    const playlist = this.store.activePlayer.attributes.media_playlist ?? 'Play Queue';
    return this.store.activePlayer.attributes.media_channel ? `${playlist} (not active)` : playlist;
  }

  private get selectedQueueIndex(): number {
    const pos = this.store.activePlayer.attributes.queue_position;
    return pos ? pos - 1 : -1;
  }

  private get displayItems(): MediaPlayerItem[] {
    return this.showOnlyMatches ? this.shownIndices.map((i) => this.queueItems[i]) : this.queueItems;
  }

  protected willUpdate(changed: PropertyValues): void {
    if (changed.has('store')) {
      this.fetchQueue();
    }
  }

  private async fetchQueue() {
    try {
      const queue = await this.store.hassService.getQueue(this.store.activePlayer);
      const hash = queue.map((item) => item.title).join('|');
      if (hash !== this.lastQueueHash) {
        this.lastQueueHash = hash;
        this.queueItems = queue;
      }
    } catch (e) {
      console.warn('Error getting queue', e);
    }
    this.loading = false;
  }

  render() {
    const hasSelection = this.selectedIndices.size > 0;
    const operationRunning = this.operationProgress !== null;
    const shownIndices = this.showOnlyMatches ? this.shownIndices : [];
    return html`
      <div class="queue-container" @keydown=${this.onKeyDown} tabindex="-1">
        <sonos-operation-overlay
          .progress=${this.operationProgress}
          .hass=${this.store.hass}
          @cancel-operation=${() => (this.cancelOperation = true)}
        ></sonos-operation-overlay>
        <sonos-queue-header
          .queueTitle=${this.queueTitle}
          .itemCount=${this.queueItems.length}
          .items=${this.queueItems}
          .selectMode=${this.selectMode}
          .hasSelection=${hasSelection}
          .operationRunning=${operationRunning}
          .store=${this.store}
          @queue-search-action=${this.onSearchAction}
          @queue-header-action=${this.onHeaderAction}
        ></sonos-queue-header>
        <sonos-queue-list
          .loading=${this.loading}
          .searchExpanded=${this.searchExpanded}
          .selectedIndex=${this.selectedQueueIndex}
          .searchHighlightIndex=${this.searchHighlightIndex}
          .selectMode=${this.selectMode}
          .showQueueButton=${!this.selectMode}
          .store=${this.store}
          .displayItems=${this.displayItems}
          .shownIndices=${shownIndices}
          .selectedIndices=${this.selectedIndices}
          @queue-list-action=${this.onListAction}
        ></sonos-queue-list>
      </div>
    `;
  }

  private onSearchAction = (e: CustomEvent<QueueSearchAction>) => {
    const a = e.detail;
    if (a.type === 'match') {
      this.searchHighlightIndex = a.payload.index;
    } else if (a.type === 'select-all') {
      this.selectedIndices = new Set([...this.selectedIndices, ...a.payload.indices]);
    } else if (a.type === 'expanded') {
      this.searchExpanded = a.payload.expanded;
    } else if (a.type === 'show-only') {
      this.showOnlyMatches = a.payload.showOnlyMatches;
      this.shownIndices = a.payload.shownIndices;
    }
  };

  private onHeaderAction = (e: CustomEvent<QueueHeaderAction>) => {
    const handlers: Record<string, () => void | Promise<void>> = {
      'toggle-select-mode': this.toggleSelectMode,
      'invert-selection': this.invertSelection,
      'play-selected': this.handlePlaySelected,
      'queue-selected-after-current': this.handleQueueAfterCurrent,
      'delete-selected': this.handleDeleteSelected,
      'clear-queue': this.clearQueue,
    };
    handlers[e.detail.type]?.();
  };

  private onListAction = (e: CustomEvent<QueueListAction>) => {
    const a = e.detail;
    if (a.type === 'item-click') {
      this.onItemClick(a.payload.displayIndex);
    } else if (a.type === 'checkbox-change') {
      this.selectedIndices = updateSelection(this.selectedIndices, a.payload.realIndex, a.payload.checked);
    } else if (a.type === 'queue-item') {
      this.handleQueueItem(a.payload.realIndex);
    }
  };

  private progressSetter = (p: OperationProgress | null) => (this.operationProgress = p);
  private cancelChecker = () => this.cancelOperation;

  private async handleQueueItem(index: number) {
    this.cancelOperation = false;
    await queueAfterCurrent(this.store, this.store.activePlayer, this.queueItems, index, this.progressSetter, this.cancelChecker, () =>
      this.refetchAndScroll(),
    );
  }

  private handleQueueAfterCurrent = () => this.runBatchOp(queueSelectedAfterCurrent, () => this.exitAndRefetch());
  private handlePlaySelected = () => this.runBatchOp(playSelected, () => this.exitAndRefetch());
  private handleDeleteSelected = () => this.runBatchOp(deleteSelected, () => this.exitAndRefetch());
  private async runBatchOp(fn: typeof queueSelectedAfterCurrent, onDone: () => Promise<void>) {
    this.cancelOperation = false;
    await fn(this.store, this.store.activePlayer, this.queueItems, this.selectedIndices, this.progressSetter, this.cancelChecker, onDone);
  }

  private async refetchAndScroll() {
    await this.fetchQueue();
    await this.updateComplete;
    await new Promise((r) => requestAnimationFrame(r));
    const pos = this.store.activePlayer.attributes.queue_position;
    if (pos) {
      this.shadowRoot?.querySelector<QueueList>('sonos-queue-list')?.scrollToItem(pos - 1);
    }
  }

  private async exitAndRefetch() {
    this.exitSelectMode();
    await this.refetchAndScroll();
  }
  private async onItemClick(displayIndex: number) {
    if (this.selectMode) {
      return;
    }
    const realIndex = this.showOnlyMatches && this.shownIndices.length > 0 ? this.shownIndices[displayIndex] : displayIndex;
    await this.store.mediaControlService.playQueue(this.store.activePlayer, realIndex);
    this.dispatchEvent(customEvent(MEDIA_ITEM_SELECTED));
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && this.selectMode) {
      this.exitSelectMode();
    }
  };
  private toggleSelectMode = () => {
    this.selectMode = !this.selectMode;
    this.selectedIndices = clearSelection();
  };
  private exitSelectMode() {
    this.selectMode = false;
    this.selectedIndices = clearSelection();
  }
  private invertSelection = () => {
    this.selectedIndices = invertSelection(this.selectedIndices, this.queueItems.length);
  };

  private clearQueue = async () => {
    await this.store.hassService.clearQueue(this.store.activePlayer);
    this.exitSelectMode();
    await this.fetchQueue();
  };

  static get styles() {
    return [listStyle, ...queueStyles];
  }
}
