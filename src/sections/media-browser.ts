import { css, html, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';
import {
  mdiAlphaABoxOutline,
  mdiArrowLeft,
  mdiContentSave,
  mdiContentSaveCheck,
  mdiDotsVertical,
  mdiGrid,
  mdiHome,
  mdiListBoxOutline,
} from '@mdi/js';
import Store from '../model/store';
import '../upstream/ha-media-player-browse';
import { MEDIA_ITEM_SELECTED } from '../constants';
import { customEvent } from '../utils/utils';
import { MediaPlayerItem } from '../types';

type LayoutType = 'auto' | 'grid' | 'list';

interface NavigateId {
  media_content_id?: string;
  media_content_type?: string;
  title?: string;
}

const START_PATH_KEY = 'sonos-card-media-browser-start';
const LAYOUT_KEY = 'sonos-card-media-browser-layout';

// Module-level state to persist across section switches (resets on page reload)
let currentPath: NavigateId[] | null = null;
let currentPathTitle = '';

export class MediaBrowser extends LitElement {
  @property({ attribute: false }) store!: Store;
  @state() private navigateIds: NavigateId[] = [];
  @state() private currentTitle = '';
  @state() private isCurrentPathStart = false;
  @state() private layout: LayoutType = 'auto';

  connectedCallback() {
    super.connectedCallback();
    this.initializeNavigateIds();
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

  private getStartPath(): NavigateId[] | null {
    const startPath = localStorage.getItem(START_PATH_KEY);
    if (startPath) {
      try {
        return JSON.parse(startPath);
      } catch {
        return null;
      }
    }
    return null;
  }

  private initializeNavigateIds() {
    // If we have a cached path from section switching, use it
    if (currentPath) {
      this.navigateIds = currentPath;
      this.currentTitle = currentPathTitle;
      this.updateIsCurrentPathStart();
      return;
    }

    // On page reload: use saved start path if available, otherwise root
    const startPath = this.getStartPath();
    if (startPath?.length) {
      this.navigateIds = startPath;
      const lastItem = this.navigateIds[this.navigateIds.length - 1];
      this.currentTitle = lastItem?.title || '';
    } else {
      this.navigateIds = [{ media_content_id: undefined, media_content_type: undefined }];
    }
    this.updateIsCurrentPathStart();
  }

  private saveCurrentPath() {
    currentPath = this.navigateIds;
    currentPathTitle = this.currentTitle;
  }

  private updateIsCurrentPathStart() {
    const startPath = this.getStartPath();
    this.isCurrentPathStart = JSON.stringify(this.navigateIds) === JSON.stringify(startPath);
  }

  private toggleStartPath = () => {
    if (this.isCurrentPathStart) {
      localStorage.removeItem(START_PATH_KEY);
      this.isCurrentPathStart = false;
    } else {
      localStorage.setItem(START_PATH_KEY, JSON.stringify(this.navigateIds));
      this.isCurrentPathStart = true;
    }
  };

  render() {
    const activePlayer = this.store.activePlayer;
    const canGoBack = this.navigateIds.length > 1;

    return html`
      <div class="header">
        ${canGoBack
        ? html`<ha-icon-button .path=${mdiArrowLeft} @click=${this.goBack}></ha-icon-button>`
        : html`<div class="spacer"></div>`}
        <span class="title">${this.currentTitle || 'Media Browser'}</span>
        <ha-icon-button .path=${mdiHome} @click=${this.goToRoot} title="Go to root"></ha-icon-button>
        <ha-icon-button
          .path=${this.isCurrentPathStart ? mdiContentSaveCheck : mdiContentSave}
          @click=${this.toggleStartPath}
          title=${this.isCurrentPathStart ? 'Unset start page' : 'Set as start page'}
        ></ha-icon-button>
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
            <ha-svg-icon
              class=${this.layout === 'grid' ? 'selected' : ''}
              slot="graphic"
              .path=${mdiGrid}
            ></ha-svg-icon>
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
      </div>
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
      this.saveCurrentPath();
      this.updateIsCurrentPathStart();
    }
  };

  private goToRoot = () => {
    this.navigateIds = [{ media_content_id: undefined, media_content_type: undefined }];
    this.currentTitle = '';
    this.saveCurrentPath();
    this.updateIsCurrentPathStart();
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
    this.saveCurrentPath();
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
      ha-svg-icon.selected {
        color: var(--primary-color);
      }
      sonos-ha-media-player-browse {
        --mdc-icon-size: 24px;
        --media-browse-item-size: 100px;
        flex: 1;
        min-height: 0;
      }
    `;
  }
}
