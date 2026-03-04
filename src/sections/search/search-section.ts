import { html, LitElement, PropertyValues } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import Store from '../../model/store';
import { LibraryFilter, SearchHeaderAction, SearchMediaType, SearchResultItem, SearchViewMode } from './search.types';
import { MusicAssistantService } from '../../services/music-assistant-service';
import { cycleLibraryFilter, restoreSearchState, saveSearchState } from './search-utils';
import { SearchService } from './search-service';
import { searchStyles } from './styles';
import './search-header';
import './search-bar';
import './search-results';
import './search-browse-view';
import type { SearchResults } from './search-results';
import type { SearchBar } from './search-bar';

export class Search extends LitElement {
  @property() store!: Store;
  @state() private mediaTypes: Set<SearchMediaType> = new Set();
  @state() private searchText = '';
  @state() private libraryFilter: LibraryFilter = 'all';
  @state() results: SearchResultItem[] = [];
  @state() loading = false;
  @state() error: string | null = null;
  @state() massConfigEntryId!: string;
  @state() private massQueueConfigEntryId!: string;
  @state() private discoveryComplete = false;
  @state() private browsingItem: SearchResultItem | null = null;
  @state() private selectMode = false;
  @state() private hasSelection = false;
  @state() private viewMode: SearchViewMode = 'list';

  @query('sonos-search-results') private searchResults!: SearchResults;
  @query('sonos-search-bar') private searchBar!: SearchBar;

  musicAssistantService!: MusicAssistantService;
  private searchService?: SearchService;

  connectedCallback(): void {
    super.connectedCallback();
    const restored = restoreSearchState();
    Object.assign(this, restored);
    if (!restored.viewMode) {
      this.viewMode = this.store?.config?.search?.defaultViewMode ?? 'list';
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.searchService?.dispose();
  }

  protected willUpdate(changedProperties: PropertyValues): void {
    if (changedProperties.has('store') && !this.searchService) {
      this.musicAssistantService = new MusicAssistantService(this.store.hass);
      this.searchService = new SearchService(this);
      this.discoverConfigEntry();
      const { defaultMediaType } = this.searchConfig;
      if (this.mediaTypes.size === 0 && defaultMediaType && (defaultMediaType as string) !== 'none') {
        this.mediaTypes = new Set([defaultMediaType]);
      }
    }
  }

  private async discoverConfigEntry() {
    const { massConfigEntryId: configuredId } = this.searchConfig;
    this.massConfigEntryId = configuredId ?? (await this.musicAssistantService.discoverConfigEntryId());
    this.massQueueConfigEntryId = await this.musicAssistantService.discoverMassQueueConfigEntryId();
    this.discoveryComplete = true;
    if (this.searchText && this.massConfigEntryId) {
      this.searchService!.execute(this.searchText, this.mediaTypes, this.libraryFilter, this.searchConfig);
    }
  }

  render() {
    if (this.store.config.entityPlatform !== 'music_assistant') {
      return html`<div class="search-container">
        <div class="config-required">
          <ha-icon icon="mdi:music-box-multiple-outline"></ha-icon>
          <div class="title">Music Assistant Required</div>
          <div>Search requires <code>entityPlatform: music_assistant</code> in the card configuration.</div>
        </div>
      </div>`;
    }
    if (!this.discoveryComplete) {
      return html`<div class="search-container">
        <div class="loading"><ha-spinner></ha-spinner></div>
      </div>`;
    }
    if (!this.massConfigEntryId) {
      return html`<div class="search-container">
        <div class="config-required">
          <ha-icon icon="mdi:music-box-multiple-outline"></ha-icon>
          <div class="title">Music Assistant Not Found</div>
          <div>Could not discover Music Assistant. Configure <code>massConfigEntryId</code> in search settings.</div>
        </div>
      </div>`;
    }
    const { title } = this.searchConfig;

    return html`
      <div class="search-container" @keydown=${this.onKeyDown} tabindex="-1">
        <sonos-search-browse-view
          ?hidden=${!this.browsingItem}
          .store=${this.store}
          .item=${this.browsingItem}
          .musicAssistantService=${this.musicAssistantService}
          .massQueueConfigEntryId=${this.massQueueConfigEntryId}
          @go-back=${() => (this.browsingItem = null)}
        ></sonos-search-browse-view>
        <div class="search-content" ?hidden=${!!this.browsingItem}>
          <sonos-search-header
            .title=${title ?? 'Search'}
            .mediaTypes=${this.mediaTypes}
            .selectMode=${this.selectMode}
            .hasSelection=${this.hasSelection}
            .libraryFilter=${this.libraryFilter}
            .viewMode=${this.viewMode}
            @header-action=${this.handleHeaderAction}
          ></sonos-search-header>
          <sonos-search-bar
            .searchText=${this.searchText}
            .mediaTypes=${this.mediaTypes}
            @search-input=${(e: CustomEvent) => this.onSearchInput(e.detail)}
            @search-submit=${() => this.searchService!.execute(this.searchText, this.mediaTypes, this.libraryFilter, this.searchConfig)}
            @clear-search=${this.clearSearch}
          ></sonos-search-bar>
          <sonos-search-results
            .store=${this.store}
            .results=${this.results}
            .loading=${this.loading}
            .error=${this.error}
            .selectMode=${this.selectMode}
            .searchText=${this.searchText}
            .viewMode=${this.viewMode}
            .musicAssistantService=${this.musicAssistantService}
            .massQueueConfigEntryId=${this.massQueueConfigEntryId}
            @browse-collection=${(e: CustomEvent) => (this.browsingItem = e.detail)}
            @has-selection-change=${(e: CustomEvent) => (this.hasSelection = e.detail)}
            @results-updated=${(e: CustomEvent) => (this.results = e.detail)}
          ></sonos-search-results>
        </div>
      </div>
    `;
  }

  private get searchConfig() {
    return this.store.config.search ?? {};
  }

  private handleHeaderAction({ detail }: CustomEvent<SearchHeaderAction>) {
    if (detail.type === 'toggle-media-type') {
      this.toggleMediaType(detail.mediaType);
    } else if (detail.type === 'toggle-select-mode') {
      this.toggleSelectMode();
    } else if (detail.type === 'toggle-library-filter') {
      this.handleToggleLibraryFilter();
    } else if (detail.type === 'toggle-view-mode') {
      this.toggleViewMode();
    } else if (detail.type === 'invert-selection') {
      this.searchResults?.handleInvertSelection();
    } else if (detail.type === 'selection-action') {
      this.searchResults?.executeSelectionAction(detail.action);
    }
  }

  private toggleMediaType(type: SearchMediaType) {
    const newTypes = new Set(this.mediaTypes);
    if (newTypes.has(type)) {
      newTypes.delete(type);
    } else {
      newTypes.add(type);
    }
    this.mediaTypes = newTypes;
    this.searchService!.scheduleSearch(this.searchText, this.mediaTypes, this.libraryFilter, this.searchConfig);
    this.searchBar?.focusInput();
  }

  private handleToggleLibraryFilter() {
    this.libraryFilter = cycleLibraryFilter(this.libraryFilter);
    this.searchService!.scheduleSearch(this.searchText, this.mediaTypes, this.libraryFilter, this.searchConfig);
  }

  private toggleSelectMode() {
    this.selectMode = !this.selectMode;
    this.searchResults?.clearSelectionState();
    this.hasSelection = false;
  }

  private toggleViewMode() {
    this.viewMode = this.viewMode === 'list' ? 'grid' : 'list';
    saveSearchState(this.mediaTypes, this.searchText, this.libraryFilter, this.viewMode);
  }

  private onSearchInput(value: string) {
    this.searchText = value;
    this.searchService!.scheduleSearch(this.searchText, this.mediaTypes, this.libraryFilter, this.searchConfig);
  }

  private clearSearch() {
    this.searchService!.clear(this.mediaTypes, this.libraryFilter);
    this.searchText = '';
    this.searchBar?.focusInput();
  }

  private onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape' && this.selectMode) {
      this.toggleSelectMode();
    }
  }

  static get styles() {
    return searchStyles;
  }
}
