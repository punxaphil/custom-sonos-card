import { css, html, LitElement, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import {
  mdiAlphaABoxOutline,
  mdiArrowLeft,
  mdiBookmark,
  mdiDotsVertical,
  mdiFolderStar,
  mdiFolderStarOutline,
  mdiGrid,
  mdiListBoxOutline,
  mdiPlay,
  mdiPlayBoxMultiple,
  mdiStar,
} from '@mdi/js';
import Store from '../model/store';
import '../upstream/ha-media-player-browse';
import { HaMediaPlayerBrowse } from '../upstream/ha-media-player-browse';
import '../components/favorites-list';
import '../components/favorites-icons';
import { MEDIA_ITEM_SELECTED } from '../constants';
import { customEvent } from '../utils/utils';
import { FavoritesConfig, MediaBrowserConfig, MediaBrowserShortcut, MediaPlayerItem } from '../types';
import { indexOfWithoutSpecialChars } from '../utils/media-browse-utils';

type LayoutType = 'auto' | 'grid' | 'list';
type ViewType = 'favorites' | 'browser';

interface NavigateId {
  media_content_id?: string;
  media_content_type?: string;
  title?: string;
}

const START_PATH_KEY = 'sonos-card-media-browser-start';
const LAYOUT_KEY = 'sonos-card-media-browser-layout';
const FAVORITES_VIEW = 'favorites';

// Module-level state to persist across section switches (resets on page reload)
let currentPath: NavigateId[] | null = null;
let currentPathTitle = '';
let currentView: ViewType | null = null;

export class MediaBrowser extends LitElement {
  @property({ attribute: false }) store!: Store;
  @state() private navigateIds: NavigateId[] = [];
  @state() private currentTitle = '';
  @state() private isCurrentPathStart = false;
  @state() private layout: LayoutType = 'auto';
  @state() private view: ViewType = 'favorites';
  @state() private playAllLoading = false;
  @state() private mediaLoaded = false;
  @state() private cachedFavorites: MediaPlayerItem[] | null = null;
  private cachedFavoritesPlayerId: string | null = null;
  @query('sonos-ha-media-player-browse') private mediaBrowser?: HaMediaPlayerBrowse;

  connectedCallback() {
    super.connectedCallback();
    this.initializeView();
    this.loadLayout();
    if (this.view === 'favorites') {
      this.loadFavorites();
    }
  }

  willUpdate(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('store') && this.view === 'favorites') {
      const playerId = this.store?.activePlayer?.id;
      if (playerId && playerId !== this.cachedFavoritesPlayerId) {
        this.loadFavorites();
      }
    }
  }

  private async loadFavorites() {
    const playerId = this.store?.activePlayer?.id;
    if (!playerId) {
      return;
    }
    this.cachedFavoritesPlayerId = playerId;
    this.cachedFavorites = await this.getFavorites();
  }

  private onShortcutClick = () => {
    const shortcut = this.store.config.mediaBrowser?.shortcut;
    if (shortcut) {
      // Navigate to browser view with the shortcut path
      this.view = 'browser';
      this.navigateIds = [
        { media_content_id: undefined, media_content_type: undefined },
        {
          media_content_id: shortcut.media_content_id,
          media_content_type: shortcut.media_content_type,
          title: shortcut.name,
        },
      ];
      this.currentTitle = shortcut.name || '';
      this.saveCurrentState();
      this.updateIsCurrentPathStart();
    }
  };

  private loadLayout() {
    const savedLayout = localStorage.getItem(LAYOUT_KEY) as LayoutType | null;
    if (savedLayout && ['auto', 'grid', 'list'].includes(savedLayout)) {
      this.layout = savedLayout;
    }
  }

  private setLayout(layout: LayoutType) {
    this.layout = layout;
    localStorage.setItem(LAYOUT_KEY, layout);
  }

  private handleMenuAction = (ev: CustomEvent<{ item: { value: string } }>) => {
    this.setLayout(ev.detail.item.value as LayoutType);
  };

  private getStartPath(): string | null {
    return localStorage.getItem(START_PATH_KEY);
  }

  private initializeView() {
    const onlyFavorites = this.store.config.mediaBrowser?.onlyFavorites ?? false;

    // If onlyFavorites is enabled, always show favorites
    if (onlyFavorites) {
      this.view = 'favorites';
      this.updateIsCurrentPathStart();
      return;
    }

    // If we have a cached view from section switching, use it
    if (currentView !== null) {
      this.view = currentView;
      if (this.view === 'browser' && currentPath) {
        this.navigateIds = currentPath;
        this.currentTitle = currentPathTitle;
      }
      this.updateIsCurrentPathStart();
      return;
    }

    // On page reload: use saved start path if available, otherwise favorites
    const startPath = this.getStartPath();
    if (startPath === FAVORITES_VIEW) {
      this.view = 'favorites';
    } else if (startPath) {
      try {
        this.navigateIds = JSON.parse(startPath);
        const lastItem = this.navigateIds[this.navigateIds.length - 1];
        this.currentTitle = lastItem?.title || '';
        this.view = 'browser';
      } catch {
        this.view = 'favorites';
      }
    } else {
      this.view = 'favorites';
    }
    this.updateIsCurrentPathStart();
  }

  private saveCurrentState() {
    currentView = this.view;
    if (this.view === 'browser') {
      currentPath = this.navigateIds;
      currentPathTitle = this.currentTitle;
    }
  }

  private updateIsCurrentPathStart() {
    const startPath = this.getStartPath();
    if (this.view === 'favorites') {
      // Favorites is start if explicitly saved OR if nothing is saved (default)
      this.isCurrentPathStart = startPath === FAVORITES_VIEW || startPath === null;
    } else {
      this.isCurrentPathStart = startPath === JSON.stringify(this.navigateIds);
    }
  }

  private toggleStartPath = () => {
    if (this.isCurrentPathStart) {
      localStorage.removeItem(START_PATH_KEY);
      this.isCurrentPathStart = false;
    } else {
      const value = this.view === 'favorites' ? FAVORITES_VIEW : JSON.stringify(this.navigateIds);
      localStorage.setItem(START_PATH_KEY, value);
      this.isCurrentPathStart = true;
    }
  };

  private goToFavorites = () => {
    this.view = 'favorites';
    this.navigateIds = [];
    this.currentTitle = '';
    this.saveCurrentState();
    this.updateIsCurrentPathStart();
    this.loadFavorites();
  };

  private goToBrowser = () => {
    this.view = 'browser';
    this.navigateIds = [{ media_content_id: undefined, media_content_type: undefined }];
    this.currentTitle = '';
    this.saveCurrentState();
    this.updateIsCurrentPathStart();
  };

  render() {
    if (this.view === 'favorites') {
      return this.renderFavorites();
    }
    return this.renderBrowser();
  }

  private renderFavorites() {
    const mediaBrowserConfig: MediaBrowserConfig = this.store.config.mediaBrowser ?? {};
    const favoritesConfig: FavoritesConfig = mediaBrowserConfig.favorites ?? {};
    const title = favoritesConfig.title ?? 'Favorites';
    const hideHeader = mediaBrowserConfig.hideHeader ?? false;
    const onlyFavorites = mediaBrowserConfig.onlyFavorites ?? false;

    const shortcut = mediaBrowserConfig.shortcut;

    return html`
      ${hideHeader
        ? ''
        : html`<div class="header">
            <div class="spacer"></div>
            <span class="title">${title}</span>
            ${onlyFavorites ? '' : this.renderShortcutButton(shortcut)}
            ${onlyFavorites
              ? ''
              : html`<ha-icon-button
                    .path=${mdiPlayBoxMultiple}
                    @click=${this.goToBrowser}
                    title="Browse Media"
                  ></ha-icon-button>
                  <ha-icon-button
                    class=${this.isCurrentPathStart ? 'startpath-active' : ''}
                    .path=${this.isCurrentPathStart ? mdiFolderStar : mdiFolderStarOutline}
                    @click=${this.toggleStartPath}
                    title=${this.isCurrentPathStart ? 'Unset start page' : 'Set as start page'}
                  ></ha-icon-button>`}
            ${this.renderLayoutMenu()}
          </div>`}
      ${this.renderFavoritesContent()}
    `;
  }

  private renderShortcutButton(shortcut: MediaBrowserShortcut | undefined) {
    // Only show if all required properties are provided
    if (!shortcut?.media_content_id || !shortcut?.media_content_type || !shortcut?.name) {
      return nothing;
    }
    const icon = shortcut.icon ?? mdiBookmark;
    const isActive = this.isInShortcutFolder(shortcut);
    return html`
      <ha-icon-button
        class=${isActive ? 'shortcut-active' : ''}
        @click=${this.onShortcutClick}
        title=${shortcut.name}
        .path=${icon.startsWith('mdi:') ? undefined : icon}
      >
        ${icon.startsWith('mdi:') ? html`<ha-icon .icon=${icon}></ha-icon>` : nothing}
      </ha-icon-button>
    `;
  }

  private isInShortcutFolder(shortcut: MediaBrowserShortcut): boolean {
    if (this.view !== 'browser' || this.navigateIds.length < 2) {
      return false;
    }
    // Check if any item in the path matches the shortcut
    return this.navigateIds.some((nav) => nav.media_content_id === shortcut.media_content_id);
  }

  private renderLayoutMenu() {
    return html`
      <ha-dropdown @wa-select=${this.handleMenuAction}>
        <ha-icon-button slot="trigger" .path=${mdiDotsVertical}></ha-icon-button>
        <ha-dropdown-item value="auto" .selected=${this.layout === 'auto'}>
          <ha-svg-icon slot="icon" .path=${mdiAlphaABoxOutline}></ha-svg-icon>
          Auto
        </ha-dropdown-item>
        <ha-dropdown-item value="grid" .selected=${this.layout === 'grid'}>
          <ha-svg-icon slot="icon" .path=${mdiGrid}></ha-svg-icon>
          Grid
        </ha-dropdown-item>
        <ha-dropdown-item value="list" .selected=${this.layout === 'list'}>
          <ha-svg-icon slot="icon" .path=${mdiListBoxOutline}></ha-svg-icon>
          List
        </ha-dropdown-item>
      </ha-dropdown>
    `;
  }

  private renderFavoritesContent() {
    if (!this.cachedFavorites) {
      return nothing;
    }
    if (!this.cachedFavorites.length) {
      return html`<div class="no-items">No favorites found</div>`;
    }
    const useGrid = this.layout !== 'list';
    if (useGrid) {
      return html`
        <sonos-favorites-icons
          .items=${this.cachedFavorites}
          .store=${this.store}
          @item-selected=${this.onFavoriteSelected}
        ></sonos-favorites-icons>
      `;
    } else {
      return html`
        <sonos-favorites-list
          .items=${this.cachedFavorites}
          .store=${this.store}
          @item-selected=${this.onFavoriteSelected}
        ></sonos-favorites-list>
      `;
    }
  }

  private async getFavorites() {
    const favoritesConfig: FavoritesConfig = this.store.config.mediaBrowser?.favorites ?? {};
    const player = this.store.activePlayer;
    let favorites = await this.store.mediaBrowseService.getFavorites(player);
    const topItems = favoritesConfig.topItems ?? [];
    favorites.sort((a, b) => this.sortFavorites(a.title, b.title, topItems));
    favorites = [
      ...(favoritesConfig.customFavorites?.[player.id]?.map(MediaBrowser.createFavorite) || []),
      ...(favoritesConfig.customFavorites?.all?.map(MediaBrowser.createFavorite) || []),
      ...favorites,
    ];
    return favoritesConfig.numberToShow ? favorites.slice(0, favoritesConfig.numberToShow) : favorites;
  }

  private sortFavorites(a: string, b: string, topItems: string[]) {
    const aIndex = indexOfWithoutSpecialChars(topItems, a);
    const bIndex = indexOfWithoutSpecialChars(topItems, b);
    if (aIndex > -1 && bIndex > -1) {
      return aIndex - bIndex;
    }
    let result = bIndex - aIndex;
    if (result === 0) {
      result = a.localeCompare(b, 'en', { sensitivity: 'base' });
    }
    return result;
  }

  private static createFavorite(source: MediaPlayerItem) {
    return { ...source, can_play: true };
  }

  private onFavoriteSelected = async (event: CustomEvent) => {
    const mediaItem = event.detail as MediaPlayerItem;
    await this.playFavorite(mediaItem);
    this.dispatchEvent(customEvent(MEDIA_ITEM_SELECTED, mediaItem));
  };

  private async playFavorite(mediaItem: MediaPlayerItem) {
    const player = this.store.activePlayer;
    if (mediaItem.media_content_type || mediaItem.media_content_id) {
      await this.store.mediaControlService.playMedia(player, mediaItem);
    } else {
      await this.store.mediaControlService.setSource(player, mediaItem.title);
    }
  }

  private renderBrowser() {
    const mediaBrowserConfig: MediaBrowserConfig = this.store.config.mediaBrowser ?? {};
    const activePlayer = this.store.activePlayer;
    const canGoBack = this.navigateIds.length > 1;
    const hideHeader = mediaBrowserConfig.hideHeader ?? false;
    const title = this.currentTitle || 'Media Browser';
    const shortcut = mediaBrowserConfig.shortcut;

    return html`
      ${this.playAllLoading ? html`<div class="loading-overlay"><div class="loading-spinner"></div></div>` : nothing}
      ${hideHeader
        ? ''
        : html`<div class="header">
            ${canGoBack
              ? html`<ha-icon-button .path=${mdiArrowLeft} @click=${this.goBack}></ha-icon-button>`
              : html`<div class="spacer"></div>`}
            <span class="title">${title}</span>
            ${this.renderPlayAllButton()}${this.renderShortcutButton(shortcut)}
            <ha-icon-button .path=${mdiStar} @click=${this.goToFavorites} title="Favorites"></ha-icon-button>
            <ha-icon-button
              class=${this.isCurrentPathStart ? 'startpath-active' : ''}
              .path=${this.isCurrentPathStart ? mdiFolderStar : mdiFolderStarOutline}
              @click=${this.toggleStartPath}
              title=${this.isCurrentPathStart ? 'Unset start page' : 'Set as start page'}
            ></ha-icon-button>
            ${this.renderLayoutMenu()}
          </div>`}
      <sonos-ha-media-player-browse
        .hass=${this.store.hass}
        .entityId=${activePlayer.id}
        .navigateIds=${this.navigateIds}
        .preferredLayout=${this.layout}
        .itemsPerRow=${mediaBrowserConfig.itemsPerRow}
        .action=${'play'}
        @media-picked=${this.onMediaPicked}
        @media-browsed=${this.onMediaBrowsed}
      ></sonos-ha-media-player-browse>
    `;
  }

  private renderPlayAllButton() {
    const playableCount = this.mediaBrowser?.getPlayableChildren().length ?? 0;
    if (playableCount === 0 || this.playAllLoading) {
      return nothing;
    }
    return html`<ha-icon-button
      .path=${mdiPlay}
      @click=${this.playAll}
      title="Play all (${playableCount} tracks)"
    ></ha-icon-button>`;
  }

  private async playAll() {
    const children = this.mediaBrowser?.getPlayableChildren() || [];
    if (children.length === 0) {
      return;
    }
    this.playAllLoading = true;
    try {
      const player = this.store.activePlayer;
      // Play first item (replaces queue)
      await this.store.hass.callService('media_player', 'play_media', {
        entity_id: player.id,
        media_content_id: children[0].media_content_id,
        media_content_type: children[0].media_content_type,
        enqueue: 'replace',
      });
      // Add remaining items to queue in parallel
      const addPromises = children.slice(1).map((child) =>
        this.store.hass.callService('media_player', 'play_media', {
          entity_id: player.id,
          media_content_id: child.media_content_id,
          media_content_type: child.media_content_type,
          enqueue: 'add',
        }),
      );
      await Promise.all(addPromises);
      this.dispatchEvent(customEvent(MEDIA_ITEM_SELECTED, children[0]));
    } catch (e) {
      console.error('Failed to play all:', e);
    } finally {
      this.playAllLoading = false;
    }
  }

  private goBack = () => {
    if (this.navigateIds.length > 1) {
      this.navigateIds = this.navigateIds.slice(0, -1);
      const lastItem = this.navigateIds[this.navigateIds.length - 1];
      this.currentTitle = lastItem?.title || '';
      this.saveCurrentState();
      this.updateIsCurrentPathStart();
    }
  };

  private onMediaPicked = async (event: CustomEvent) => {
    const mediaItem = event.detail.item as MediaPlayerItem;
    await this.store.mediaControlService.playMedia(this.store.activePlayer, mediaItem);
    this.dispatchEvent(customEvent(MEDIA_ITEM_SELECTED, mediaItem));
  };

  private onMediaBrowsed = (event: CustomEvent) => {
    this.navigateIds = event.detail.ids;
    const isRoot = this.navigateIds.length === 1 && !this.navigateIds[0].media_content_id;
    const lastItem = this.navigateIds[this.navigateIds.length - 1];
    this.currentTitle = isRoot ? '' : lastItem?.title || event.detail.current?.title || '';
    // Toggle to trigger re-render so renderPlayAllButton can access updated mediaBrowser
    this.mediaLoaded = !this.mediaLoaded;
    this.saveCurrentState();
    this.updateIsCurrentPathStart();
  };

  static get styles() {
    return css`
      :host {
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow: hidden;
      }
      .header {
        display: flex;
        align-items: center;
        padding: 4px 8px;
        border-bottom: 1px solid var(--divider-color);
        background: var(--card-background-color);
      }
      .title {
        flex: 1;
        font-weight: 500;
        font-size: calc(var(--sonos-font-size, 1rem) * 1.1);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        text-align: center;
      }
      .spacer {
        width: 48px;
      }
      .no-items {
        text-align: center;
        margin-top: 50%;
      }
      ha-icon-button.startpath-active {
        color: var(--accent-color);
      }
      ha-icon-button.shortcut-active {
        color: var(--accent-color);
      }
      .loading-overlay {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10;
      }
      .loading-spinner {
        width: 40px;
        height: 40px;
        border: 3px solid var(--secondary-text-color);
        border-top-color: transparent;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
      sonos-ha-media-player-browse,
      sonos-favorites-icons,
      sonos-favorites-list {
        --mdc-icon-size: 24px;
        --media-browse-item-size: 100px;
        flex: 1;
        min-height: 0;
        overflow: auto;
      }
    `;
  }
}
