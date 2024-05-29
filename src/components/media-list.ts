import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import Store from '../model/store';
import './media-row';
import { CardConfig, MediaPlayerItem } from '../types';
import { customEvent } from '../utils/utils';
import { listStyle, MEDIA_ITEM_SELECTED, mediaTitleStyle } from '../constants';
import { itemsWithFallbacks } from '../utils/media-browser-utils';

export class MediaList extends LitElement {
  @property({ attribute: false }) store!: Store;
  @property({ type: Array }) items!: MediaPlayerItem[];
  @property() selected!: number;
  private config!: CardConfig;

  render() {
    this.config = this.store.config;

    return html`
      <mwc-list multi class="list">
        ${itemsWithFallbacks(this.items, this.config).map((item, index) => {
          return html`
            <sonos-media-row
              @click=${() => this.dispatchEvent(customEvent(MEDIA_ITEM_SELECTED, { item, index }))}
              .item=${item}
              .selected=${this.selected !== undefined && this.selected === index}
            ></sonos-media-row>
          `;
        })}
      </mwc-list>
    `;
  }

  static get styles() {
    return [
      css`
        .button {
          --icon-width: 35px;
          height: 40px;
        }

        .row {
          display: flex;
        }

        .thumbnail {
          width: var(--icon-width);
          height: var(--icon-width);
          background-size: contain;
          background-repeat: no-repeat;
          background-position: left;
        }

        .title {
          font-size: 1.1rem;
          align-self: center;
          flex: 1;
        }
      `,
      mediaTitleStyle,
      listStyle,
    ];
  }
}

customElements.define('sonos-media-list', MediaList);
