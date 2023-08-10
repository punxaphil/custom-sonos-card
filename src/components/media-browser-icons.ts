import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import './media-browser-icon';
import Store from '../store';
import { MediaPlayerItem } from '../types';
import { getWidth, hasItemsWithImage } from '../utils';
import { styleMap } from 'lit-html/directives/style-map.js';

export class MediaBrowserIcons extends LitElement {
  @property() store!: Store;
  @property() items!: MediaPlayerItem[];

  render() {
    const itemsWithImage = hasItemsWithImage(this.items);
    let resultHtml = html``;
    let row = html``;
    const itemsPerRow = 4;
    this.items.forEach((item, index) => {
      row = html`${row}<sonos-media-browser-icon
          .itemsWithImage="${itemsWithImage}"
          .mediaItem="${item}"
          .config="${this.store.config}"
        ></sonos-media-browser-icon>`;
      if ((index > 0 && (index + 1) % itemsPerRow === 0) || index === this.items.length + 1) {
        resultHtml = html`${resultHtml}<ha-control-button-group style=${this.groupStyle()}>
            ${row}
          </ha-control-button-group>`;
        row = html``;
      }
    });
    return resultHtml;
  }

  private groupStyle() {
    const height = (getWidth(this.store.config) / 4) * 0.95;

    return styleMap({
      height: `${height}rem`,
    });
  }
}

customElements.define('sonos-media-browser-icons', MediaBrowserIcons);
