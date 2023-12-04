import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { MediaPlayerEntityFeature } from '../types';
import Store from '../model/store';
import { haPlayer } from './ha-player';

class MediaBrowserHeader extends LitElement {
  @property() store!: Store;

  render() {
    return html`
      <div class="title">All Favorites</div>
      ${haPlayer(this.store, [MediaPlayerEntityFeature.BROWSE_MEDIA], {
        padding: '0.5rem',
        flex: '1',
        textAlign: 'right',
      })}
    `;
  }

  static get styles() {
    return css`
      :host {
        display: flex;
        justify-content: space-between;
      }
      .title {
        flex: 1;
        text-align: center;
        font-size: 1.2rem;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    `;
  }
}

customElements.define('sonos-media-browser-header', MediaBrowserHeader);
