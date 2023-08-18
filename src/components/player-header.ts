import { HomeAssistant } from 'custom-card-helpers';
import { HassEntity } from 'home-assistant-js-websocket';
import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import Store from '../store';
import { CardConfig } from '../types';
import { getCurrentTrack, getSpeakerList } from '../utils/utils';

class PlayerHeader extends LitElement {
  @property() store!: Store;
  private hass!: HomeAssistant;
  private config!: CardConfig;
  private entity!: HassEntity;

  render() {
    ({ config: this.config, hass: this.hass, entity: this.entity } = this.store);
    const attributes = this.entity.attributes;
    const speakerList = getSpeakerList(this.store.groups[this.entity.entity_id], this.config);
    let song = this.config.labelWhenNoMediaIsSelected ? this.config.labelWhenNoMediaIsSelected : 'No media selected';
    if (attributes.media_title) {
      song = getCurrentTrack(this.entity);
    }
    return html` <div class="info">
      <div class="entity">${speakerList}</div>
      <div class="song">${song}</div>
      <div class="artist-album">${attributes.media_album_name}</div>
      <sonos-progress .store=${this.store}></sonos-progress>
    </div>`;
  }

  static get styles() {
    return css`
      .info {
        margin: 0.25rem;
        padding: 0.5rem 3.5rem;
        text-align: center;
      }

      .entity {
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: 1rem;
        font-weight: 500;
        color: var(--secondary-text-color);
        white-space: nowrap;
      }

      .song {
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: 1.15rem;
        font-weight: 400;
        color: var(--accent-color);
      }

      .artist-album {
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: 1rem;
        font-weight: 300;
        color: var(--secondary-text-color);
      }
    `;
  }
}

customElements.define('sonos-player-header', PlayerHeader);
