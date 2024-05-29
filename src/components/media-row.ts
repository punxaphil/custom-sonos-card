import { css, html, LitElement, PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';
import Store from '../model/store';
import { MediaPlayerItem } from '../types';
import { renderThumbnailAndTitle } from '../utils/utils';

class MediaRow extends LitElement {
  @property({ attribute: false }) store!: Store;
  @property({ attribute: false }) item!: MediaPlayerItem;
  @property({ type: Boolean }) selected = false;

  render() {
    return html`
      <mwc-list-item hasMeta ?selected=${this.selected} ?activated=${this.selected} class="button">
        <div class="row">${renderThumbnailAndTitle(this.item.thumbnail, this.item.title)}</div>
      </mwc-list-item>
    `;
  }

  protected async firstUpdated(_changedProperties: PropertyValues) {
    super.firstUpdated(_changedProperties);
    await this.scrollToSelected(_changedProperties);
  }

  protected async updated(_changedProperties: PropertyValues) {
    super.updated(_changedProperties);
    await this.scrollToSelected(_changedProperties);
  }

  private async scrollToSelected(_changedProperties: PropertyValues) {
    await new Promise((r) => setTimeout(r, 0));
    if (this.selected && _changedProperties.has('selected')) {
      this.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  static get styles() {
    return css`
      mwc-list-item {
        margin: 0.3rem;
        border-radius: 0.3rem;
        background: var(--secondary-background-color);
      }
    `;
  }
}

customElements.define('sonos-media-row', MediaRow);
