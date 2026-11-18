import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { styleMap } from 'lit-html/directives/style-map.js';
import Store from '../../../model/store';

export class FavoriteTypeHeader extends LitElement {
  @property({ attribute: false }) store!: Store;
  @property({ type: String }) favoriteType?: string;
  @property({ type: String }) previousType?: string;

  willUpdate() {
    this.hidden = !this.store.config.mediaBrowser?.favorites?.sortByType || !this.favoriteType || this.favoriteType === this.previousType;
  }

  render() {
    const config = this.store.config.mediaBrowser?.favorites;
    return html`
      <div
        style=${styleMap({
          color: config?.typeColor,
          fontSize: config?.typeFontSize,
          fontWeight: config?.typeFontWeight,
          marginBottom: config?.typeMarginBottom,
        })}
      >
        ${this.favoriteType}
      </div>
    `;
  }

  static styles = css`
    :host {
      display: block;
      width: 100%;
      margin-top: 0.2rem;
      margin-left: 15px;
      font-weight: bold;
    }

    :host([hidden]) {
      display: none;
    }
  `;
}

customElements.define('sonos-favorite-type-header', FavoriteTypeHeader);
