import { css, html, LitElement, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { mdiArrowLeft } from '@mdi/js';
import Store from '../model/store';
import '../upstream/ha-media-player-browse';
import { MEDIA_ITEM_SELECTED } from '../constants';
import { customEvent } from '../utils/utils';
import { MediaPlayerItem } from '../types';

interface NavigateId {
  media_content_id?: string;
  media_content_type?: string;
  title?: string;
}

export class MediaBrowser extends LitElement {
  @property({ attribute: false }) store!: Store;
  @state() private navigateIds: NavigateId[] = [{ media_content_id: undefined, media_content_type: undefined }];
  @state() private currentTitle = '';

  render() {
    const activePlayer = this.store.activePlayer;
    const canGoBack = this.navigateIds.length > 1;

    return html`
      ${canGoBack
        ? html`
            <div class="header">
              <ha-icon-button .path=${mdiArrowLeft} @click=${this.goBack}></ha-icon-button>
              <span class="title">${this.currentTitle}</span>
            </div>
          `
        : nothing}
      <sonos-ha-media-player-browse
        .hass=${this.store.hass}
        .entityId=${activePlayer.id}
        .navigateIds=${this.navigateIds}
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
    }
  };

  private onMediaPicked = async (event: CustomEvent) => {
    const mediaItem = event.detail.item as MediaPlayerItem;
    await this.store.mediaControlService.playMedia(this.store.activePlayer, mediaItem);
    this.dispatchEvent(customEvent(MEDIA_ITEM_SELECTED, mediaItem));
  };

  private onMediaBrowsed = (event: CustomEvent) => {
    this.navigateIds = event.detail.ids;
    const lastItem = this.navigateIds[this.navigateIds.length - 1];
    this.currentTitle = lastItem?.title || event.detail.current?.title || '';
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
        padding: 8px;
        border-bottom: 1px solid var(--divider-color);
        background: var(--card-background-color);
      }
      .title {
        font-weight: 500;
        font-size: 1.1em;
        margin-left: 8px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
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
