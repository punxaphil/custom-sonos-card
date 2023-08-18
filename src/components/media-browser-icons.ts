import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import Store from '../store';
import { CardConfig, MediaPlayerItem } from '../types';
import { dispatchMediaItemSelected } from '../utils';
import { mediaBrowserTitleStyle } from '../constants';
import { itemsWithFallbacks, mediaItemBackgroundImageStyle, renderMediaBrowserItem } from '../media-browser-utils';

export class MediaBrowserIcons extends LitElement {
  @property() store!: Store;
  @property() items!: MediaPlayerItem[];
  private config!: CardConfig;

  render() {
    ({ config: this.config } = this.store);

    return html`
      <style>
        :host {
          --items-per-row: ${this.config.mediaBrowserItemsPerRow};
        }
      </style>
      <div class="icons">
        ${itemsWithFallbacks(this.items, this.config).map(
          (item, index) =>
            html`
              ${mediaItemBackgroundImageStyle(item.thumbnail, index)}
              <ha-control-button class="button" @click="${() => dispatchMediaItemSelected(item)}">
                ${renderMediaBrowserItem(item, !item.thumbnail)}
              </ha-control-button>
            `,
        )}
      </div>
    `;
  }
  static get styles() {
    return [
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

        .folder {
          margin: 5% 15% 25% 15%;
          --mdc-icon-size: 100%;
        }

        .title {
          font-size: 0.8rem;
          position: absolute;
          width: 100%;
          line-height: 160%;
          bottom: 0;
          background-color: #ffffffbb;
        }
      `,
      mediaBrowserTitleStyle,
    ];
  }
}

customElements.define('sonos-media-browser-icons', MediaBrowserIcons);
