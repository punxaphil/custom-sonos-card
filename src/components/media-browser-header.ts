import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { MediaPlayerEntityFeature } from '../types';
import Store from '../model/store';

class MediaBrowserHeader extends LitElement {
  @property({attribute: false}) store!: Store;

  render() {
    return html`
      <div class="title">All Favorites</div>
      <sonos-ha-player
        .store=${this.store}
        .features=${[MediaPlayerEntityFeature.BROWSE_MEDIA]}
        class="browse"
      ></sonos-ha-player>
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
      .browse {
        margin: 0.5rem;
      }
    `;
  }
}

customElements.define('sonos-media-browser-header', MediaBrowserHeader);
