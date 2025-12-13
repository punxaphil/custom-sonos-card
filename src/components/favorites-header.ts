import { css, html, LitElement, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import Store from '../model/store';
import { mdiPlayBoxMultiple } from '@mdi/js';

class FavoritesHeader extends LitElement {
  @property({ attribute: false }) store!: Store;

  render() {
    if (this.store.config.favoritesHideHeader) {
      return nothing;
    }
    return html`
      <div class="title">${this.store.config.favoritesTitle ?? 'All Favorites'}</div>
      <ha-icon-button
        hide=${this.store.config.favoritesHideBrowseMediaButton || nothing}
        @click=${() => this.store.mediaBrowseService.showBrowseMedia(this.store.activePlayer, this)}
        .path=${mdiPlayBoxMultiple}
      ></ha-icon-button>
    `;
  }

  static get styles() {
    return css`
      :host {
        display: flex;
        justify-content: space-between;
        padding: 0.5rem;
      }
      .title {
        flex: 1;
        text-align: center;
        font-size: 1.2rem;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0.5rem;
      }
      *[hide] {
        display: none;
      }
    `;
  }
}

customElements.define('sonos-favorites-header', FavoritesHeader);
