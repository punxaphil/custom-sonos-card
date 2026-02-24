import { html, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';
import Store from '../../model/store';
import { MEDIA_ITEM_SELECTED } from '../../constants';
import { customEvent } from '../../utils/utils';
import { clearSelection, invertSelection, updateSelection } from '../../utils/selection-utils';
import { toMediaPlayerItem, toggleMassItemProperty } from './search-utils';
import { getSelectedItems, executeBatchPlay, executeBatchQueue } from './search-batch-utils';
import { searchResultsStyles } from './styles';
import '../../components/media-row';
import '../../components/operation-overlay';
import '../../components/play-menu';
import { SearchResultItem } from './search.types';
import { OperationProgress } from '../../types';
import type { EnqueueMode } from '../../services/music-assistant-service';
import type { PlayMenuAction } from '../../components/play-menu';
import { MusicAssistantService } from '../../services/music-assistant-service';

export class SearchResults extends LitElement {
  @property({ attribute: false }) store!: Store;
  @property({ attribute: false }) results: SearchResultItem[] = [];
  @property({ type: Boolean }) loading = false;
  @property() error: string | null = null;
  @property({ type: Boolean }) selectMode = false;
  @property() searchText = '';
  @property({ attribute: false }) musicAssistantService!: MusicAssistantService;
  @property() massQueueConfigEntryId = '';
  @state() private selectedIndices = new Set<number>();
  @state() private favoriteLoadingIndices = new Set<number>();
  @state() private libraryLoadingIndices = new Set<number>();
  @state() private playMenuItemIndex: number | null = null;
  @state() private operationProgress: OperationProgress | null = null;
  @state() private cancelOperation = false;

  render() {
    const hasContent = !this.loading && !this.error && this.results.length > 0;
    const autoSearchMinChars = this.store.config.search?.autoSearchMinChars ?? 2;
    const tooShort = this.searchText && this.searchText.trim().length < autoSearchMinChars;
    const noResults = !this.loading && this.results.length === 0 && this.searchText && !tooShort;
    const emptyPrompt = !this.loading && this.results.length === 0 && !this.searchText;

    return html`
      <sonos-operation-overlay
        .progress=${this.operationProgress}
        .hass=${this.store.hass}
        @cancel-operation=${() => (this.cancelOperation = true)}
      ></sonos-operation-overlay>
      <div class="loading" ?hidden=${!this.loading}><ha-spinner></ha-spinner></div>
      <div class="error-message" ?hidden=${!this.error}>${this.error}</div>
      <div class="no-results" ?hidden=${!tooShort}>Type at least ${autoSearchMinChars} characters to search</div>
      <div class="no-results" ?hidden=${!noResults}>No results found</div>
      <div class="no-results" ?hidden=${!emptyPrompt}>Enter a search term</div>
      <div class="list" ?hidden=${!hasContent}>
        <mwc-list multi>
          ${this.results.map((item, index) => {
            const mediaPlayerItem = toMediaPlayerItem(item);
            return html`
              <sonos-media-row
                @click=${() => this.onItemClick(index)}
                .item=${mediaPlayerItem}
                .showCheckbox=${this.selectMode}
                .checked=${this.selectedIndices.has(index)}
                .isFavorite=${item.favorite ?? null}
                .favoriteLoading=${this.favoriteLoadingIndices.has(index)}
                .isInLibrary=${item.inLibrary ?? null}
                .libraryLoading=${this.libraryLoadingIndices.has(index)}
                @checkbox-change=${(e: CustomEvent) => this.onCheckboxChange(index, e.detail.checked)}
                @favorite-toggle=${() => this.toggleItemState(index, 'favorite')}
                @library-toggle=${() => this.toggleItemState(index, 'library')}
                .store=${this.store}
              ></sonos-media-row>
            `;
          })}
        </mwc-list>
      </div>
      <div class="play-menu-overlay" ?hidden=${this.playMenuItemIndex === null} @click=${() => (this.playMenuItemIndex = null)}>
        <sonos-play-menu
          .hasSelection=${true}
          .inline=${true}
          @play-menu-action=${(e: CustomEvent) => this.handleItemPlayAction(e)}
          @play-menu-close=${() => (this.playMenuItemIndex = null)}
        ></sonos-play-menu>
      </div>
    `;
  }

  get hasSelection(): boolean {
    return this.selectedIndices.size > 0;
  }

  handleInvertSelection() {
    this.selectedIndices = invertSelection(this.selectedIndices, this.results.length);
  }

  clearSelectionState() {
    this.selectedIndices = clearSelection();
    this.playMenuItemIndex = null;
  }

  async executeSelectionAction(detail: { enqueue?: EnqueueMode; radioMode?: boolean }) {
    const enqueue: EnqueueMode = detail.enqueue ?? 'play';
    const radioMode = detail.radioMode ?? false;
    const items = getSelectedItems(this.results, this.selectedIndices);
    if (items.length === 0) {
      return;
    }
    this.cancelOperation = false;
    const callbacks = {
      setProgress: (p: OperationProgress | null) => (this.operationProgress = p),
      shouldCancel: () => this.cancelOperation,
      onComplete: () => {
        this.selectedIndices = clearSelection();
        this.dispatchEvent(customEvent('has-selection-change', false));
        this.dispatchEvent(customEvent(MEDIA_ITEM_SELECTED));
      },
    };
    if (enqueue === 'next' || enqueue === 'replace_next' || enqueue === 'add') {
      await executeBatchQueue(this.store, items, enqueue === 'add' ? 'add' : 'next', callbacks);
    } else {
      const firstIndex = Array.from(this.selectedIndices).sort((a, b) => a - b)[0];
      await executeBatchPlay(this.store, this.musicAssistantService, items, this.results[firstIndex], enqueue, radioMode, callbacks);
    }
  }

  private onItemClick(index: number) {
    const item = this.results[index];
    if (!item) {
      return;
    }
    if (this.selectMode) {
      this.selectedIndices = updateSelection(this.selectedIndices, index, !this.selectedIndices.has(index));
      this.dispatchEvent(customEvent('has-selection-change', this.selectedIndices.size > 0));
      return;
    }
    if (item.mediaType === 'album' || item.mediaType === 'playlist' || item.mediaType === 'artist') {
      this.dispatchEvent(customEvent('browse-collection', item));
      return;
    }
    this.playMenuItemIndex = this.playMenuItemIndex === index ? null : index;
  }

  private async handleItemPlayAction(e: CustomEvent<PlayMenuAction>) {
    const item = this.results[this.playMenuItemIndex!];
    if (!item) {
      return;
    }
    this.playMenuItemIndex = null;
    await this.musicAssistantService.playMedia(this.store.activePlayer, item.uri, e.detail.enqueue as EnqueueMode, e.detail.radioMode);
    this.dispatchEvent(customEvent(MEDIA_ITEM_SELECTED));
  }

  private onCheckboxChange(index: number, checked: boolean) {
    this.selectedIndices = updateSelection(this.selectedIndices, index, checked);
    this.dispatchEvent(customEvent('has-selection-change', this.selectedIndices.size > 0));
  }

  private async toggleItemState(index: number, kind: 'favorite' | 'library') {
    if (!this.massQueueConfigEntryId || !this.results[index]) {
      return;
    }
    const item = this.results[index];
    this.setItemLoading(index, kind, true);
    try {
      const success = await toggleMassItemProperty(this.musicAssistantService, this.massQueueConfigEntryId, item, kind);
      if (success) {
        const currentValue = kind === 'favorite' ? item.favorite : item.inLibrary;
        const newResults = [...this.results];
        newResults[index] = { ...item, [kind === 'favorite' ? 'favorite' : 'inLibrary']: !currentValue };
        this.dispatchEvent(customEvent('results-updated', newResults));
      }
    } finally {
      this.setItemLoading(index, kind, false);
    }
  }

  private setItemLoading(index: number, kind: 'favorite' | 'library', loading: boolean) {
    const prop = kind === 'favorite' ? 'favoriteLoadingIndices' : 'libraryLoadingIndices';
    const next = new Set(this[prop]);
    if (loading) {
      next.add(index);
    } else {
      next.delete(index);
    }
    this[prop] = next;
  }

  static get styles() {
    return searchResultsStyles;
  }
}

customElements.define('sonos-search-results', SearchResults);
