import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import Store from '../model/store';
import { CardConfig, MediaPlayerItem } from '../types';
import { dispatch } from '../utils/utils';
import { MEDIA_ITEM_SELECTED, mediaBrowserTitleStyle } from '../constants';
import {
  itemsWithFallbacks,
  mediaItemBackgroundImageStyle,
  renderMediaBrowserItem,
} from '../utils/media-browser-utils';

export class MediaBrowserIcons extends LitElement {
  @property({ attribute: false }) store!: Store;
  @property({ attribute: false }) items!: MediaPlayerItem[];
  private config!: CardConfig;

  render() {
    this.config = this.store.config;

    return html`
      <style>
        :host {
          --items-per-row: ${this.config.mediaBrowserItemsPerRow};
        }
      </style>
      <div class="icons">
        ${itemsWithFallbacks(this.items, this.config).map(
          (item, index) => html`
            ${mediaItemBackgroundImageStyle(item.thumbnail, index)}
            <ha-control-button class="button" @click="${() => dispatch(MEDIA_ITEM_SELECTED, item)}">
              ${renderMediaBrowserItem(item, !item.thumbnail || !!this.config.mediaBrowserShowTitleForThumbnailIcons)}
            </ha-control-button>
          `,
        )}
      </div>
    `;
  }
  static get styles() {
    return [
      mediaBrowserTitleStyle,
      css`
        .icons {
          display: flex;
          flex-wrap: wrap;
        }

        .button {
          --margin: 1%;
          --width: calc(100% / var(--items-per-row) - var(--margin) * 2);
          width: var(--width);
          height: var(--width);
          margin: var(--margin);
        }

        .thumbnail {
          width: 100%;
          padding-bottom: 100%;
          margin: 0 6%;
          background-size: 100%;
          background-repeat: no-repeat;
          background-position: center;
        }

        .title {
          font-size: 0.8rem;
          position: absolute;
          width: 100%;
          line-height: 160%;
          bottom: 0;
          background-color: rgba(var(--rgb-card-background-color), 0.733);
        }
      `,
    ];
  }
}

customElements.define('sonos-media-browser-icons', MediaBrowserIcons);
