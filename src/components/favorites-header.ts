import { css, html, LitElement, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import Store from '../model/store';
import { mdiPlayBoxMultiple } from '@mdi/js';

class FavoritesHeader extends LitElement {
  @property({ attribute: false }) store!: Store;

  render() {
    const favoritesConfig = this.store.config.favorites ?? {};
    if (favoritesConfig.hideHeader) {
      return nothing;
    }
    return html`
      <div class="title">${favoritesConfig.title ?? 'All Favorites'}</div>
      <ha-icon-button
        hide=${favoritesConfig.hideBrowseMediaButton || nothing}
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
