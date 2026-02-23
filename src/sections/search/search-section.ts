import { html, LitElement, nothing, PropertyValues } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import Store from '../../model/store';
import { listStyle, MEDIA_ITEM_SELECTED } from '../../constants';
import { customEvent } from '../../utils/utils';
import { clearSelection, invertSelection, updateSelection } from '../../utils/selection-utils';
import { queueItemsAfterCurrent } from '../../utils/batch-operation-utils';
import {
  mdiAccessPoint,
  mdiAccount,
  mdiAlbum,
  mdiArrowLeft,
  mdiBookshelf,
  mdiCheck,
  mdiCheckboxMultipleMarkedOutline,
  mdiClose,
  mdiDotsVertical,
  mdiMagnify,
  mdiMusic,
  mdiPlay,
  mdiPlayBoxMultiple,
  mdiPlaylistMusic,
  mdiPlaylistPlus,
  mdiRadio,
  mdiSkipNext,
  mdiSkipNextCircle,
} from '@mdi/js';
import '../../components/media-row';
import '../../components/operation-overlay';
import '../../components/selection-actions';
import '../../components/play-menu';
import { MediaPlayerItem, OperationProgress, SearchMediaType, SearchResultItem } from '../../types';
import type { EnqueueMode } from '../../services/music-assistant-service';
import type { PlayMenuAction } from '../../components/play-menu';
import { MusicAssistantService } from '../../services/music-assistant-service';
import { searchStyles } from './styles';

const LOCAL_STORAGE_KEY = 'sonos-search-state';

type LibraryFilter = 'all' | 'library' | 'non-library';

interface SearchState {
  mediaTypes?: SearchMediaType[];
  searchText: string;
  libraryFilter?: LibraryFilter;
}

export class Search extends LitElement {
  @property() store!: Store;
  @state() private mediaTypes: Set<SearchMediaType> = new Set(['track']);
  @state() private searchText = '';
  @state() private libraryFilter: LibraryFilter = 'all';
  @state() private results: SearchResultItem[] = [];
  @state() private loading = false;
  @state() private error: string | null = null;
  @state() private selectedIndices = new Set<number>();
  @state() private operationProgress: OperationProgress | null = null;
  @state() private massConfigEntryId!: string;
  @state() private massQueueConfigEntryId!: string;
  @state() private discoveryComplete = false;
  @state() private cancelOperation = false;
  @state() private favoriteLoadingIndices = new Set<number>();
  @state() private libraryLoadingIndices = new Set<number>();
  @state() private browsingItem: SearchResultItem | null = null;
  @state() private browseResults: SearchResultItem[] = [];
  @state() private browseLoading = false;
  @state() private selectMode = false;
  @state() private filterMenuOpen = false;
  @state() private playMenuItemIndex: number | null = null;

  @query('input') private input?: HTMLInputElement;

  private musicAssistantService!: MusicAssistantService;
  private initialized = false;
  private debounceTimer?: ReturnType<typeof setTimeout>;

  private get searchTitle(): string {
    return this.store.config.search?.title ?? 'Search';
  }

  private get searchLimit(): number {
    return this.store.config.search?.searchLimit ?? 50;
  }

  private get autoSearchMinChars(): number {
    return this.store.config.search?.autoSearchMinChars ?? 2;
  }

  private get autoSearchDebounceMs(): number {
    return this.store.config.search?.autoSearchDebounceMs ?? 1000;
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.restoreState();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
  }

  protected willUpdate(changedProperties: PropertyValues): void {
    if (changedProperties.has('store') && !this.initialized) {
      this.initialized = true;
      this.musicAssistantService = new MusicAssistantService(this.store.hass);
      this.discoverConfigEntry();
      // Apply default media type if no saved state and default is empty
      const defaultType = this.store.config.search?.defaultMediaType;
      if (this.mediaTypes.size === 0 && defaultType && (defaultType as string) !== 'none') {
        this.mediaTypes = new Set([defaultType]);
      }
    }
  }

  private async discoverConfigEntry() {
    const configuredId = this.store.config.search?.massConfigEntryId;
    if (configuredId) {
      this.massConfigEntryId = configuredId;
    } else {
      this.massConfigEntryId = await this.musicAssistantService.discoverConfigEntryId();
    }

    this.massQueueConfigEntryId = await this.musicAssistantService.discoverMassQueueConfigEntryId();

    this.discoveryComplete = true;
    this.runPendingSearch();
  }

  private runPendingSearch() {
    // Re-run search if we have saved state
    if (this.searchText && this.massConfigEntryId) {
      this.performSearch();
    }
  }

  private restoreState() {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const state: SearchState = JSON.parse(saved);
        this.mediaTypes = state.mediaTypes?.length ? new Set(state.mediaTypes) : new Set(['track']);
        this.searchText = state.searchText ?? '';
        this.libraryFilter = state.libraryFilter ?? 'all';
      }
    } catch {
      // Ignore parse errors
    }
  }

  private saveState() {
    const state: SearchState = {
      mediaTypes: Array.from(this.mediaTypes),
      searchText: this.searchText,
      libraryFilter: this.libraryFilter,
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
  }

  private get isMusicAssistantPlatform(): boolean {
    return this.store.config.entityPlatform === 'music_assistant';
  }

  render() {
    if (!this.isMusicAssistantPlatform) {
      return this.renderConfigRequired();
    }

    if (!this.discoveryComplete) {
      return html`
        <div class="search-container">
          <div class="loading"><ha-spinner></ha-spinner></div>
        </div>
      `;
    }

    if (!this.massConfigEntryId) {
      return this.renderDiscoveryFailed();
    }

    return html`
      <div class="search-container" @keydown=${this.onKeyDown} tabindex="-1">
        <sonos-operation-overlay
          .progress=${this.operationProgress}
          .hass=${this.store.hass}
          @cancel-operation=${this.cancelCurrentOperation}
        ></sonos-operation-overlay>
        ${this.browsingItem ? this.renderBrowseView() : this.renderSearchView()}
      </div>
    `;
  }

  private renderConfigRequired() {
    return html`
      <div class="search-container">
        <div class="config-required">
          <ha-icon icon="mdi:music-box-multiple-outline"></ha-icon>
          <div class="title">Music Assistant Required</div>
          <div>Search requires <code>entityPlatform: music_assistant</code> in the card configuration.</div>
        </div>
      </div>
    `;
  }

  private renderDiscoveryFailed() {
    return html`
      <div class="search-container">
        <div class="config-required">
          <ha-icon icon="mdi:music-box-multiple-outline"></ha-icon>
          <div class="title">Music Assistant Not Found</div>
          <div>
            Could not discover Music Assistant integration. Make sure it is installed and running, or configure
            <code>massConfigEntryId</code> in the card's search settings.
          </div>
        </div>
      </div>
    `;
  }

  private renderSearchView() {
    return html`${this.renderHeader()} ${this.renderSearchBar()} ${this.renderContent()} ${this.renderPlayMenuOverlay()}`;
  }

  private renderPlayMenuOverlay() {
    if (this.playMenuItemIndex === null) {
      return nothing;
    }
    const index = this.playMenuItemIndex;
    return html`
      <div class="play-menu-overlay" @click=${() => (this.playMenuItemIndex = null)}>
        <sonos-play-menu
          .hasSelection=${true}
          .inline=${true}
          @play-menu-action=${(e: CustomEvent) => this.handleItemPlayAction(index, e)}
          @play-menu-close=${() => (this.playMenuItemIndex = null)}
        ></sonos-play-menu>
      </div>
    `;
  }

  private renderBrowseView() {
    const item = this.browsingItem!;
    const typeIcon = this.getMediaTypeIcon(item.mediaType);
    return html`
      <div class="header browse-header">
        <ha-icon-button .path=${mdiArrowLeft} @click=${this.goBack} title="Back to results"></ha-icon-button>
        <ha-dropdown @wa-select=${this.handlePlayMenuAction}>
          <ha-icon-button slot="trigger" .path=${mdiPlay} title="Play options"></ha-icon-button>
          <ha-dropdown-item value="0">
            <ha-svg-icon slot="icon" .path=${mdiPlayBoxMultiple}></ha-svg-icon>
            Play Now (clear queue)
          </ha-dropdown-item>
          <ha-dropdown-item value="1">
            <ha-svg-icon slot="icon" .path=${mdiAccessPoint}></ha-svg-icon>
            Start Radio
          </ha-dropdown-item>
          <ha-dropdown-item value="2">
            <ha-svg-icon slot="icon" .path=${mdiPlay}></ha-svg-icon>
            Play Now
          </ha-dropdown-item>
          <ha-dropdown-item value="3">
            <ha-svg-icon slot="icon" .path=${mdiSkipNext}></ha-svg-icon>
            Play Next
          </ha-dropdown-item>
          <ha-dropdown-item value="4">
            <ha-svg-icon slot="icon" .path=${mdiPlaylistPlus}></ha-svg-icon>
            Add to Queue
          </ha-dropdown-item>
          <ha-dropdown-item value="5">
            <ha-svg-icon slot="icon" .path=${mdiSkipNextCircle}></ha-svg-icon>
            Play Next (clear queue)
          </ha-dropdown-item>
        </ha-dropdown>
        <span class="browse-title" title=${item.title}>${item.title}</span>
        <ha-icon-button .path=${typeIcon} disabled class="type-indicator"></ha-icon-button>
      </div>
      ${this.renderBrowseContent()}
    `;
  }

  private renderBrowseContent() {
    if (this.browseLoading) {
      return html`<div class="list">
        <div class="loading"><ha-spinner></ha-spinner></div>
      </div>`;
    }

    if (this.browseResults.length === 0) {
      return html`<div class="list"><div class="no-results">No items found</div></div>`;
    }

    return html`
      <div class="list">
        <mwc-list multi>
          ${this.browseResults.map((item, index) => {
            const mediaPlayerItem = this.toMediaPlayerItem(item);
            return html`
              <sonos-media-row
                @click=${() => this.onBrowseItemClick(index)}
                .item=${mediaPlayerItem}
                .store=${this.store}
              ></sonos-media-row>
            `;
          })}
        </mwc-list>
      </div>
    `;
  }

  private getMediaTypeIcon(mediaType: SearchMediaType): string {
    switch (mediaType) {
      case 'album':
        return mdiAlbum;
      case 'artist':
        return mdiAccount;
      case 'playlist':
        return mdiPlaylistMusic;
      case 'radio':
        return mdiRadio;
      case 'track':
        return mdiMusic;
      default:
        return mdiMusic;
    }
  }

  private handlePlayMenuAction(e: CustomEvent<{ item: { value: string } }>) {
    const actions: { enqueue: EnqueueMode; radioMode?: boolean }[] = [
      { enqueue: 'replace' },
      { enqueue: 'play', radioMode: true },
      { enqueue: 'play' },
      { enqueue: 'next' },
      { enqueue: 'add' },
      { enqueue: 'replace_next' },
    ];
    const action = actions[parseInt(e.detail.item.value)];
    if (action) {
      this.playCollection(action.enqueue, action.radioMode);
    }
  }

  private async playCollection(enqueue: EnqueueMode, radioMode?: boolean) {
    if (!this.browsingItem) {
      return;
    }
    await this.musicAssistantService.playMedia(this.store.activePlayer, this.browsingItem.uri, enqueue, radioMode);
    this.dispatchEvent(customEvent(MEDIA_ITEM_SELECTED));
  }

  private async browseCollection(item: SearchResultItem) {
    this.browsingItem = item;
    this.browseLoading = true;
    this.browseResults = [];
    try {
      this.browseResults = await this.musicAssistantService.getCollectionItems(
        item.uri,
        item.mediaType,
        this.massQueueConfigEntryId,
      );
    } catch (e) {
      console.error('Failed to browse collection:', e);
    } finally {
      this.browseLoading = false;
    }
  }

  private goBack() {
    this.browsingItem = null;
    this.browseResults = [];
    this.browseLoading = false;
  }

  private async onBrowseItemClick(index: number) {
    const item = this.browseResults[index];
    if (!item) {
      return;
    }
    const mediaPlayerItem = this.toMediaPlayerItem(item);
    await this.store.mediaControlService.playMedia(this.store.activePlayer, mediaPlayerItem, 'play');
    this.dispatchEvent(customEvent(MEDIA_ITEM_SELECTED));
  }

  private renderHeader() {
    const hasSelection = this.selectedIndices.size > 0;
    return html`
      <div class="header">
        <div class="title-container">
          <span class="title">${this.searchTitle}</span>
        </div>
        <div class="header-icons">
          ${this.selectMode
            ? html`
                <sonos-selection-actions
                  .hasSelection=${hasSelection}
                  .disabled=${this.operationProgress !== null}
                  .showInvert=${hasSelection}
                  @invert-selection=${this.handleInvertSelection}
                  @play-selected=${this.handleSelectionPlayAction}
                  @queue-selected=${this.handleSelectionPlayAction}
                  @queue-selected-at-end=${this.handleSelectionPlayAction}
                ></sonos-selection-actions>
              `
            : html`
                <div class="media-type-icons">
                  <ha-icon-button
                    .path=${mdiMusic}
                    @click=${() => this.toggleMediaType('track')}
                    ?selected=${this.mediaTypes.has('track')}
                    title="Search Tracks"
                  ></ha-icon-button>
                  <ha-icon-button
                    .path=${mdiAccount}
                    @click=${() => this.toggleMediaType('artist')}
                    ?selected=${this.mediaTypes.has('artist')}
                    title="Search Artists"
                  ></ha-icon-button>
                  <ha-icon-button
                    .path=${mdiPlaylistMusic}
                    @click=${() => this.toggleMediaType('playlist')}
                    ?selected=${this.mediaTypes.has('playlist')}
                    title="Search Playlists"
                  ></ha-icon-button>
                  <div class="separator"></div>
                  <div class="filter-menu-anchor">
                    <ha-icon-button
                      .path=${mdiDotsVertical}
                      @click=${this.toggleFilterMenu}
                      title="More filters"
                      ?selected=${this.mediaTypes.has('album') ||
                      this.mediaTypes.has('radio') ||
                      this.libraryFilter !== 'all'}
                    ></ha-icon-button>
                    ${this.filterMenuOpen ? this.renderFilterMenu() : nothing}
                  </div>
                </div>
              `}
          <ha-icon-button
            .path=${mdiCheckboxMultipleMarkedOutline}
            @click=${this.toggleSelectMode}
            ?selected=${this.selectMode}
            title="Select mode"
          ></ha-icon-button>
        </div>
      </div>
    `;
  }

  private renderFilterMenu() {
    return html`
      <div class="filter-menu" @click=${(e: Event) => e.stopPropagation()}>
        <div class="filter-menu-item" @click=${() => this.toggleMediaType('album')}>
          <ha-svg-icon .path=${mdiAlbum}></ha-svg-icon>
          <span>Albums</span>
          ${this.mediaTypes.has('album') ? html`<ha-svg-icon class="check" .path=${mdiCheck}></ha-svg-icon>` : nothing}
        </div>
        <div class="filter-menu-item" @click=${() => this.toggleMediaType('radio')}>
          <ha-svg-icon .path=${mdiRadio}></ha-svg-icon>
          <span>Radio</span>
          ${this.mediaTypes.has('radio') ? html`<ha-svg-icon class="check" .path=${mdiCheck}></ha-svg-icon>` : nothing}
        </div>
        <div class="filter-menu-divider"></div>
        <div class="filter-menu-item" @click=${this.toggleLibraryFilter}>
          <ha-svg-icon .path=${mdiBookshelf}></ha-svg-icon>
          <span
            >${this.libraryFilter === 'all'
              ? 'All'
              : this.libraryFilter === 'library'
                ? 'Library only'
                : 'Non-library only'}</span
          >
          ${this.libraryFilter !== 'all' ? html`<ha-svg-icon class="check" .path=${mdiCheck}></ha-svg-icon>` : nothing}
        </div>
        <div class="filter-menu-divider"></div>
        <div class="filter-menu-done" @click=${this.closeFilterMenu}>Done</div>
      </div>
    `;
  }

  private toggleFilterMenu() {
    this.filterMenuOpen = !this.filterMenuOpen;
  }

  private closeFilterMenu() {
    this.filterMenuOpen = false;
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

  private renderSearchBar() {
    const typeLabels = this.getSearchTypeLabels();
    return html`
      <div class="search-bar">
        <ha-icon-button .path=${mdiMagnify} @click=${this.performSearch}></ha-icon-button>
        <input
          type="text"
          placeholder="Search ${typeLabels}..."
          .value=${this.searchText}
          @input=${this.onSearchInput}
          @keydown=${this.onSearchKeyDown}
        />
        ${this.searchText
          ? html`<ha-icon-button .path=${mdiClose} @click=${this.clearSearch} title="Clear"></ha-icon-button>`
          : nothing}
      </div>
    `;
  }

  private getSearchTypeLabels(): string {
    if (this.mediaTypes.size === 0) {
      return 'all';
    }
    const labels: string[] = [];
    if (this.mediaTypes.has('track')) {
      labels.push('tracks');
    }
    if (this.mediaTypes.has('artist')) {
      labels.push('artists');
    }
    if (this.mediaTypes.has('album')) {
      labels.push('albums');
    }
    if (this.mediaTypes.has('playlist')) {
      labels.push('playlists');
    }
    if (this.mediaTypes.has('radio')) {
      labels.push('radio');
    }
    return labels.join(', ');
  }

  private renderContent() {
    if (this.loading) {
      return html`<div class="list">
        <div class="loading"><ha-spinner></ha-spinner></div>
      </div>`;
    }

    if (this.error) {
      return html`<div class="list"><div class="error-message">${this.error}</div></div>`;
    }

    if (this.results.length === 0 && this.searchText && this.searchText.trim().length < this.autoSearchMinChars) {
      return html`
        <div class="list">
          <div class="no-results">Type at least ${this.autoSearchMinChars} characters to search</div>
        </div>
      `;
    }

    if (this.results.length === 0 && this.searchText) {
      return html`
        <div class="list">
          <div class="no-results">No results found</div>
        </div>
      `;
    }

    if (this.results.length === 0) {
      return html`
        <div class="list">
          <div class="no-results">Enter a search term</div>
        </div>
      `;
    }

    return html`
      <div class="list">
        <mwc-list multi>
          ${this.results.map((item, index) => {
            const isChecked = this.selectedIndices.has(index);
            const mediaPlayerItem = this.toMediaPlayerItem(item);
            const isFavoriteLoading = this.favoriteLoadingIndices.has(index);
            const isLibraryLoading = this.libraryLoadingIndices.has(index);
            return html`
              <sonos-media-row
                @click=${() => this.onItemClick(index)}
                .item=${mediaPlayerItem}
                .showCheckbox=${this.selectMode}
                .checked=${isChecked}
                .isFavorite=${item.favorite ?? null}
                .favoriteLoading=${isFavoriteLoading}
                .isInLibrary=${item.inLibrary ?? null}
                .libraryLoading=${isLibraryLoading}
                @checkbox-change=${(e: CustomEvent) => this.onCheckboxChange(index, e.detail.checked)}
                @favorite-toggle=${() => this.onFavoriteToggle(index)}
                @library-toggle=${() => this.onLibraryToggle(index)}
                .store=${this.store}
              ></sonos-media-row>
            `;
          })}
        </mwc-list>
      </div>
    `;
  }

  private toMediaPlayerItem(item: SearchResultItem): MediaPlayerItem {
    return {
      title: item.subtitle ? `${item.title} ${item.subtitle}` : item.title,
      media_content_id: item.uri,
      media_content_type: item.mediaType,
      thumbnail: item.imageUrl,
    };
  }

  private toggleMediaType(type: SearchMediaType) {
    const newTypes = new Set(this.mediaTypes);
    if (newTypes.has(type)) {
      newTypes.delete(type);
    } else {
      newTypes.add(type);
    }
    this.mediaTypes = newTypes;
    this.debouncedSearch();
    this.saveState();
    this.focusInput();
  }

  private toggleLibraryFilter() {
    if (this.libraryFilter === 'all') {
      this.libraryFilter = 'library';
    } else if (this.libraryFilter === 'library') {
      this.libraryFilter = 'non-library';
    } else {
      this.libraryFilter = 'all';
    }
    this.debouncedSearch();
    this.saveState();
  }

  private debouncedSearch() {
    if (!this.searchText) {
      return;
    }
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      this.performSearch();
    }, 1000);
  }

  private focusInput() {
    this.updateComplete.then(() => {
      this.input?.focus();
    });
  }

  private onSearchInput(e: Event) {
    const input = e.target as HTMLInputElement;
    this.searchText = input.value;
    this.saveState();
    this.scheduleAutoSearch();
  }

  private scheduleAutoSearch() {
    // Clear any pending search
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Clear results if text is too short
    if (this.searchText.trim().length < this.autoSearchMinChars) {
      this.results = [];
      this.loading = false;
      return;
    }

    // Only auto-search if we have enough characters
    if (this.searchText.trim().length >= this.autoSearchMinChars) {
      this.loading = true;
      this.results = [];
      this.debounceTimer = setTimeout(() => {
        this.performSearch();
      }, this.autoSearchDebounceMs);
    }
  }

  private onSearchKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      this.performSearch();
    }
  }

  private async performSearch() {
    if (!this.searchText.trim() || !this.massConfigEntryId) {
      return;
    }

    this.loading = true;
    this.error = null;
    this.selectedIndices = new Set(); // Clear selection on new search

    // Determine which types to search
    const typesToSearch: SearchMediaType[] =
      this.mediaTypes.size > 0 ? Array.from(this.mediaTypes) : ['track', 'artist', 'album', 'playlist', 'radio'];

    try {
      this.results = await this.musicAssistantService.searchMultipleTypes(
        this.massConfigEntryId!,
        this.searchText.trim(),
        typesToSearch,
        this.searchLimit,
        this.libraryFilter,
      );
    } catch (e) {
      this.error = `Search failed: ${e instanceof Error ? e.message : 'Unknown error'}`;
      this.results = [];
    } finally {
      this.loading = false;
    }
  }

  private clearSearch() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = undefined;
    }
    this.searchText = '';
    this.results = [];
    this.loading = false;
    this.error = null;
    this.selectedIndices = new Set();
    this.saveState();
    this.focusInput();
  }

  private async onItemClick(index: number) {
    const item = this.results[index];
    if (!item) {
      return;
    }

    // In select mode, don't browse or show play menu — just toggle checkbox
    if (this.selectMode) {
      const isChecked = this.selectedIndices.has(index);
      this.selectedIndices = updateSelection(this.selectedIndices, index, !isChecked);
      return;
    }

    // Collections: browse into them instead of playing
    if (item.mediaType === 'album' || item.mediaType === 'playlist' || item.mediaType === 'artist') {
      await this.browseCollection(item);
      return;
    }

    // Tracks and radio: show play menu inline
    this.playMenuItemIndex = this.playMenuItemIndex === index ? null : index;
  }

  private async handleItemPlayAction(index: number, e: CustomEvent<PlayMenuAction>) {
    const item = this.results[index];
    if (!item) {
      return;
    }
    this.playMenuItemIndex = null;
    const action = e.detail;
    await this.musicAssistantService.playMedia(
      this.store.activePlayer,
      item.uri,
      action.enqueue as EnqueueMode,
      action.radioMode,
    );
    this.dispatchEvent(customEvent(MEDIA_ITEM_SELECTED));
  }

  private async handleSelectionPlayAction(e: CustomEvent) {
    const detail = e.detail ?? {};
    const enqueue: EnqueueMode = detail.enqueue ?? 'play';
    const radioMode = detail.radioMode ?? false;

    if (enqueue === 'next' || enqueue === 'replace_next') {
      await this.queueSelectedWithEnqueue(enqueue);
    } else if (enqueue === 'add') {
      await this.queueSelectedWithEnqueue('add');
    } else {
      await this.playSelectedWithEnqueue(enqueue, radioMode);
    }
  }

  private async playSelectedWithEnqueue(enqueue: EnqueueMode, radioMode?: boolean) {
    const items = this.getSelectedItems();
    if (items.length === 0) {
      return;
    }

    if (radioMode) {
      // For radio mode, just play the first selected item with radio
      const firstIndex = Array.from(this.selectedIndices).sort((a, b) => a - b)[0];
      const item = this.results[firstIndex];
      if (item) {
        await this.musicAssistantService.playMedia(this.store.activePlayer, item.uri, enqueue, true);
        this.selectedIndices = clearSelection();
        this.dispatchEvent(customEvent(MEDIA_ITEM_SELECTED));
      }
      return;
    }

    this.operationProgress = { current: 0, total: items.length, label: 'Loading' };

    await this.runBatchOperation((onProgress, shouldCancel) =>
      this.store.mediaControlService.queueAndPlay(
        this.store.activePlayer,
        items,
        enqueue === 'replace' ? 'replace' : 'play',
        onProgress,
        shouldCancel,
      ),
    );
  }

  private async queueSelectedWithEnqueue(enqueue: EnqueueMode) {
    const items = this.getSelectedItems();
    if (items.length === 0) {
      return;
    }

    this.operationProgress = { current: 0, total: items.length, label: 'Queueing' };

    const playMode: 'add' | 'next' | 'replace' | 'play' = enqueue === 'add' ? 'add' : 'next';
    await this.runBatchOperation((onProgress, shouldCancel) =>
      queueItemsAfterCurrent(
        items,
        (item) => this.store.mediaControlService.playMedia(this.store.activePlayer, item, playMode),
        onProgress,
        shouldCancel,
      ),
    );
  }

  private onCheckboxChange(index: number, checked: boolean) {
    this.selectedIndices = updateSelection(this.selectedIndices, index, checked);
  }

  private async onFavoriteToggle(index: number) {
    if (!this.massQueueConfigEntryId) {
      return;
    }

    const item = this.results[index];
    if (!item) {
      return;
    }

    // Set loading state
    this.favoriteLoadingIndices = new Set([...this.favoriteLoadingIndices, index]);

    try {
      let success: boolean;
      if (item.favorite) {
        success = await this.musicAssistantService.removeFromFavorites(
          this.massQueueConfigEntryId,
          item.uri,
          item.mediaType,
          item.itemId,
          item.provider,
        );
      } else {
        success = await this.musicAssistantService.addToFavorites(this.massQueueConfigEntryId, item.uri);
      }

      if (success) {
        // Update the item's favorite state
        const newResults = [...this.results];
        newResults[index] = { ...item, favorite: !item.favorite };
        this.results = newResults;
      }
    } finally {
      // Clear loading state
      const newLoadingIndices = new Set(this.favoriteLoadingIndices);
      newLoadingIndices.delete(index);
      this.favoriteLoadingIndices = newLoadingIndices;
    }
  }

  private async onLibraryToggle(index: number) {
    if (!this.massQueueConfigEntryId) {
      return;
    }

    const item = this.results[index];
    if (!item) {
      return;
    }

    // Set loading state
    this.libraryLoadingIndices = new Set([...this.libraryLoadingIndices, index]);

    try {
      let success: boolean;
      if (item.inLibrary) {
        success = await this.musicAssistantService.removeFromLibrary(
          this.massQueueConfigEntryId,
          item.uri,
          item.mediaType,
          item.itemId,
          item.provider,
        );
      } else {
        success = await this.musicAssistantService.addToLibrary(this.massQueueConfigEntryId, item.uri);
      }

      if (success) {
        // Update the item's library state
        const newResults = [...this.results];
        newResults[index] = { ...item, inLibrary: !item.inLibrary };
        this.results = newResults;
      }
    } finally {
      // Clear loading state
      const newLoadingIndices = new Set(this.libraryLoadingIndices);
      newLoadingIndices.delete(index);
      this.libraryLoadingIndices = newLoadingIndices;
    }
  }

  private handleInvertSelection() {
    this.selectedIndices = invertSelection(this.selectedIndices, this.results.length);
  }

  private getSelectedItems(): MediaPlayerItem[] {
    return Array.from(this.selectedIndices)
      .sort((a, b) => a - b)
      .map((i) => this.toMediaPlayerItem(this.results[i]));
  }

  private async runBatchOperation(
    operation: (onProgress: (completed: number) => void, shouldCancel: () => boolean) => Promise<void>,
  ) {
    this.cancelOperation = false;
    try {
      await operation(
        (completed) => {
          this.operationProgress = { ...this.operationProgress!, current: completed };
        },
        () => this.cancelOperation,
      );
      if (!this.cancelOperation) {
        this.selectedIndices = clearSelection();
        this.dispatchEvent(customEvent(MEDIA_ITEM_SELECTED));
      }
    } finally {
      this.operationProgress = null;
      this.cancelOperation = false;
    }
  }

  private cancelCurrentOperation() {
    this.cancelOperation = true;
  }

  private onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      if (this.playMenuItemIndex !== null) {
        this.playMenuItemIndex = null;
      } else if (this.filterMenuOpen) {
        this.filterMenuOpen = false;
      } else if (this.selectMode) {
        this.exitSelectMode();
      } else {
        this.selectedIndices = clearSelection();
      }
    }
  }

  static get styles() {
    return [listStyle, ...searchStyles];
  }
}
