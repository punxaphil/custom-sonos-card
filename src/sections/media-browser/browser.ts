import { html, LitElement, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { mdiArrowLeft, mdiFolderStar, mdiFolderStarOutline, mdiPlay, mdiStar } from '@mdi/js';
import Store from '../../model/store';
import '../../upstream/ha-media-player-browse';
import { HaMediaPlayerBrowse } from '../../upstream/ha-media-player-browse';
import { MEDIA_ITEM_SELECTED } from '../../constants';
import { customEvent } from '../../utils/utils';
import { MediaBrowserShortcut, MediaPlayerItem } from '../../types';
import { keyed } from 'lit/directives/keyed.js';
import { mediaBrowserStyles } from './styles';
import { renderLayoutMenu } from './layout-menu';
import { playAll, renderShortcutButton } from './utils';
import { NavigateId } from './media-browser.types';

let currentPath: NavigateId[] | null = null;
let currentPathTitle = '';

const ROOT_NAV: NavigateId = { media_content_id: undefined, media_content_type: undefined };
const START_PATH_KEY = 'sonos-card-media-browser-start';

export class MediaBrowserBrowser extends LitElement {
  @property({ attribute: false }) store!: Store;
  @property({ type: String }) layout = 'auto';
  @state() navigateIds: NavigateId[] = [];
  @state() currentTitle = '';
  @state() private isCurrentPathStart = false;
  @state() private playAllLoading = false;
  @state() private mediaLoaded = false;
  @query('sonos-ha-media-player-browse') private mediaBrowser?: HaMediaPlayerBrowse;

  connectedCallback() {
    super.connectedCallback();
    if (currentPath) {
      this.navigateIds = currentPath;
      this.currentTitle = currentPathTitle;
    } else {
      this.restoreFromStartPath();
    }
    this.updateIsCurrentPathStart();
  }

  private restoreFromStartPath() {
    const startPath = localStorage.getItem(START_PATH_KEY);
    if (!startPath) {
      this.navigateIds = [ROOT_NAV];
      return;
    }
    try {
      this.navigateIds = JSON.parse(startPath);
      this.currentTitle = this.navigateIds[this.navigateIds.length - 1]?.title || '';
    } catch {
      this.navigateIds = [ROOT_NAV];
    }
  }

  navigateToShortcut(shortcut: MediaBrowserShortcut) {
    this.navigateIds = [
      ROOT_NAV,
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

  private saveCurrentState() {
    currentPath = this.navigateIds;
    currentPathTitle = this.currentTitle;
  }

  private updateIsCurrentPathStart() {
    const startPath = localStorage.getItem(START_PATH_KEY);
    this.isCurrentPathStart = startPath === JSON.stringify(this.navigateIds);
  }

  private toggleStartPath = () => {
    if (this.isCurrentPathStart) {
      localStorage.removeItem(START_PATH_KEY);
    } else {
      localStorage.setItem(START_PATH_KEY, JSON.stringify(this.navigateIds));
    }
    this.isCurrentPathStart = !this.isCurrentPathStart;
  };

  private goToFavorites = () => {
    this.dispatchEvent(new CustomEvent('go-to-favorites'));
  };

  private goBack = () => {
    if (this.navigateIds.length <= 1) {
      return;
    }
    this.navigateIds = this.navigateIds.slice(0, -1);
    this.currentTitle = this.navigateIds[this.navigateIds.length - 1]?.title || '';
    this.saveCurrentState();
    this.updateIsCurrentPathStart();
  };

  render() {
    const config = this.store.config.mediaBrowser ?? {};
    const shortcut = config.shortcut;
    return html`
      ${this.playAllLoading ? html`<div class="loading-overlay"><div class="loading-spinner"></div></div>` : nothing}
      ${config.hideHeader
        ? ''
        : html`<div class="header">
            ${this.navigateIds.length > 1
              ? html`<ha-icon-button .path=${mdiArrowLeft} @click=${this.goBack}></ha-icon-button>`
              : html`<div class="spacer"></div>`}
            <span class="title">${this.currentTitle || 'Media Browser'}</span>
            ${this.renderPlayAllButton()} ${renderShortcutButton(shortcut, () => this.navigateToShortcut(shortcut!), this.isShortcutActive(shortcut))}
            <ha-icon-button .path=${mdiStar} @click=${this.goToFavorites} title="Favorites"></ha-icon-button>
            <ha-icon-button
              class=${this.isCurrentPathStart ? 'startpath-active' : ''}
              .path=${this.isCurrentPathStart ? mdiFolderStar : mdiFolderStarOutline}
              @click=${this.toggleStartPath}
              title=${this.isCurrentPathStart ? 'Unset start page' : 'Set as start page'}
            ></ha-icon-button>
            ${renderLayoutMenu(this.layout, this.handleLayoutChange)}
          </div>`}
      ${keyed(
        this.layout,
        html`<sonos-ha-media-player-browse
          .hass=${this.store.hass}
          .entityId=${this.store.activePlayer.id}
          .navigateIds=${this.navigateIds}
          .preferredLayout=${this.layout}
          .itemsPerRow=${config.itemsPerRow}
          .action=${'play'}
          @media-picked=${this.onMediaPicked}
          @media-browsed=${this.onMediaBrowsed}
        ></sonos-ha-media-player-browse>`,
      )}
    `;
  }

  private handleLayoutChange = (ev: CustomEvent<{ item: { value: string } }>) => {
    this.dispatchEvent(new CustomEvent('layout-change', { detail: ev.detail.item.value }));
  };

  private isShortcutActive(shortcut: MediaBrowserShortcut | undefined): boolean {
    return !!shortcut && this.navigateIds.some((nav) => nav.media_content_id === shortcut.media_content_id);
  }

  private renderPlayAllButton() {
    const playableCount = this.mediaBrowser?.getPlayableChildren().length ?? 0;
    if (playableCount === 0 || this.playAllLoading) {
      return nothing;
    }
    return html`<ha-icon-button .path=${mdiPlay} @click=${this.handlePlayAll} title="Play all (${playableCount} tracks)"></ha-icon-button>`;
  }

  private async handlePlayAll() {
    const children = this.mediaBrowser?.getPlayableChildren() || [];
    if (!children.length) {
      return;
    }
    this.playAllLoading = true;
    try {
      const firstItem = await playAll(this.store, children);
      if (firstItem) {
        this.dispatchEvent(customEvent(MEDIA_ITEM_SELECTED, firstItem));
      }
    } catch (e) {
      console.error('Failed to play all:', e);
    } finally {
      this.playAllLoading = false;
    }
  }

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
    this.mediaLoaded = !this.mediaLoaded;
    this.saveCurrentState();
    this.updateIsCurrentPathStart();
  };

  static get styles() {
    return mediaBrowserStyles;
  }
}
