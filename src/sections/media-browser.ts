import { css, html, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';
import {
  mdiAlphaABoxOutline,
  mdiArrowLeft,
  mdiDotsVertical,
  mdiFolderStar,
  mdiFolderStarOutline,
  mdiGrid,
  mdiListBoxOutline,
  mdiPlayBoxMultiple,
  mdiStar,
} from '@mdi/js';
import Store from '../model/store';
import '../upstream/ha-media-player-browse';
import '../components/favorites-list';
import '../components/favorites-icons';
import { MEDIA_ITEM_SELECTED } from '../constants';
import { customEvent } from '../utils/utils';
import { FavoritesConfig, MediaBrowserConfig, MediaPlayerItem } from '../types';
import { until } from 'lit-html/directives/until.js';
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

  connectedCallback() {
    super.connectedCallback();
    this.initializeView();
    this.loadLayout();
  }

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

  private handleMenuAction = (ev: CustomEvent<{ index: number }>) => {
    const layouts: LayoutType[] = ['auto', 'grid', 'list'];
    this.setLayout(layouts[ev.detail.index]);
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

    return html`
      ${hideHeader
        ? ''
        : html`<div class="header">
            <div class="spacer"></div>
            <span class="title">${title}</span>
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

  private renderLayoutMenu() {
    return html`
      <ha-button-menu fixed corner="BOTTOM_END" @action=${this.handleMenuAction}>
        <ha-icon-button slot="trigger" .path=${mdiDotsVertical}></ha-icon-button>
        <ha-list-item graphic="icon">
          Auto
          <ha-svg-icon
            class=${this.layout === 'auto' ? 'selected' : ''}
            slot="graphic"
            .path=${mdiAlphaABoxOutline}
          ></ha-svg-icon>
        </ha-list-item>
        <ha-list-item graphic="icon">
          Grid
          <ha-svg-icon class=${this.layout === 'grid' ? 'selected' : ''} slot="graphic" .path=${mdiGrid}></ha-svg-icon>
        </ha-list-item>
        <ha-list-item graphic="icon">
          List
          <ha-svg-icon
            class=${this.layout === 'list' ? 'selected' : ''}
            slot="graphic"
            .path=${mdiListBoxOutline}
          ></ha-svg-icon>
        </ha-list-item>
      </ha-button-menu>
    `;
  }

  private renderFavoritesContent() {
    const useGrid = this.layout !== 'list';

    return html`
      ${until(
        this.getFavorites()
          .then((items) => {
            if (items?.length) {
              if (useGrid) {
                return html`
                  <sonos-favorites-icons
                    .items=${items}
                    .store=${this.store}
                    @item-selected=${this.onFavoriteSelected}
                  ></sonos-favorites-icons>
                `;
              } else {
                return html`
                  <sonos-favorites-list
                    .items=${items}
                    .store=${this.store}
                    @item-selected=${this.onFavoriteSelected}
                  ></sonos-favorites-list>
                `;
              }
            } else {
              return html`<div class="no-items">No favorites found</div>`;
            }
          })
          .catch((e) => html`<div class="no-items">Failed to fetch favorites. ${e.message ?? JSON.stringify(e)}</div>`),
      )}
    `;
  }

  private async getFavorites() {
    const favoritesConfig: FavoritesConfig = this.store.config.mediaBrowser?.favorites ?? {};
    const player = this.store.activePlayer;
    let favorites = await this.store.mediaBrowseService.getFavorites(player);
    favorites.sort((a, b) => this.sortFavorites(a.title, b.title, favoritesConfig));
    favorites = [
      ...(favoritesConfig.customFavorites?.[player.id]?.map(MediaBrowser.createFavorite) || []),
      ...(favoritesConfig.customFavorites?.all?.map(MediaBrowser.createFavorite) || []),
      ...favorites,
    ];
    return favoritesConfig.numberToShow ? favorites.slice(0, favoritesConfig.numberToShow) : favorites;
  }

  private sortFavorites(a: string, b: string, config: FavoritesConfig) {
    const topItems = config.topItems ?? [];
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

    return html`
      ${hideHeader
        ? ''
        : html`<div class="header">
            ${canGoBack
              ? html`<ha-icon-button .path=${mdiArrowLeft} @click=${this.goBack}></ha-icon-button>`
              : html`<div class="spacer"></div>`}
            <span class="title">${title}</span>
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
        .action=${'play'}
        @media-picked=${this.onMediaPicked}
        @media-browsed=${this.onMediaBrowsed}
      ></sonos-ha-media-player-browse>
    `;
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
        font-size: 1.1em;
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
      ha-svg-icon.selected {
        color: var(--primary-color);
      }
      ha-icon-button.startpath-active {
        color: var(--accent-color);
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
