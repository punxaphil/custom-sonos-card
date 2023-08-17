import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import Store from '../store';
import { CardConfig, MediaPlayerItem } from '../types';
import { dispatchMediaItemSelected, getThumbnail, hasItemsWithImage } from '../utils';

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
        ${this.getItems().map(
          (item, index) =>
            html`
              <style>
                .button:nth-of-type(${index + 1}) > .icon {
                  background-image: url(${item.thumbnail});
                }
              </style>
              <ha-control-button class="button" @click="${() => dispatchMediaItemSelected(item)}">
                <div class="icon" ?hidden="${!item.thumbnail}"></div>
                <ha-icon class="folder" .icon=${'mdi:folder-music'} ?hidden="${!item.showFolderIcon}"></ha-icon>
                <div class="title" ?hidden="${item.thumbnail}">${item.title}</div>
              </ha-control-button>
            `,
        )}
      </div>
    `;
  }

  getItems() {
    const itemsWithImage = hasItemsWithImage(this.items);
    return this.items.map((item) => {
      const thumbnail = getThumbnail(item, this.config, itemsWithImage);
      return {
        ...item,
        thumbnail,
        showFolderIcon: item.can_expand && !thumbnail,
      };
    });
  }

  static get styles() {
    return css`
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
      .icon {
        width: 100%;
        padding-bottom: 100%;
        margin: 0 6%;
        background-size: 100%;
        background-repeat: no-repeat;
        background-position: center;
      }
      .folder {
        margin: 15%;
        --mdc-icon-size: 100%;
      }
      .title {
        font-size: 0.8rem;
        color: var(--secondary-text-color);
        font-weight: bold;
        padding: 0 0.5rem;
        text-overflow-ellipsis: ellipsis;
        overflow: hidden;
        white-space: nowrap;
        position: absolute;
        width: 100%;
        line-height: 160%;
        bottom: 0;
        background-color: rgba(255, 255, 255, 0.8);
      }
    `;
  }
}

customElements.define('sonos-media-browser-icons', MediaBrowserIcons);
