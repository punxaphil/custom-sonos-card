import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { MediaPlayerEntityFeature } from '../types';
import Store from '../model/store';
import { styleMap } from 'lit-html/directives/style-map.js';

class MediaBrowserHeader extends LitElement {
  @property() store!: Store;

  render() {
    const state = this.store.hass.states[this.store.activePlayer.id];
    const playerState = {
      ...state,
      attributes: { ...state.attributes, supported_features: MediaPlayerEntityFeature.BROWSE_MEDIA },
    };
    return html`
      <div class="title">All Favorites</div>
      <more-info-content
        .stateObj=${playerState}
        .hass=${this.store.hass}
        style=${styleMap({ padding: '0.5rem', flex: '1', textAlign: 'right' })}
      ></more-info-content>
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
