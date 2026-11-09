import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import Store from '../../../model/store';
import { CardConfig, MediaPlayerItem } from '../../../types';
import { customEvent } from '../../../utils/utils';
import { listStyle, MEDIA_ITEM_SELECTED } from '../../../constants';
import { itemsWithFallbacks } from '../../../utils/media-browse-utils';
import { LongPress } from '../../../utils/long-press';

export class FavoritesList extends LitElement {
  @property({ attribute: false }) store!: Store;
  @property({ type: Array }) items!: MediaPlayerItem[];
  private config!: CardConfig;
  private longPress = new LongPress<MediaPlayerItem>((item) =>
    this.dispatchEvent(new CustomEvent('item-long-press', { detail: { item }, bubbles: true, composed: true })),
  );

  render() {
    this.config = this.store.config;

    return html`
      <mwc-list multi class="list">
        ${itemsWithFallbacks(this.items, this.config).map((item) => {
          return html`
            <sonos-media-row
              @click=${() => !this.longPress.consumeClick() && this.dispatchEvent(customEvent(MEDIA_ITEM_SELECTED, item))}
              @pointerdown=${this.longPress.down}
              @pointermove=${this.longPress.move}
              @pointerup=${this.longPress.up}
              @pointercancel=${this.longPress.up}
              @pointerleave=${this.longPress.up}
              @contextmenu=${this.longPress.contextmenu}
              .item=${item}
              .store=${this.store}
            ></sonos-media-row>
          `;
        })}
      </mwc-list>
    `;
  }

  static get styles() {
    return listStyle;
  }
}

customElements.define('sonos-favorites-list', FavoritesList);
