import { HomeAssistant } from 'custom-card-helpers';
import { HassEntity } from 'home-assistant-js-websocket';
import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import Store from '../store';
import { CardConfig } from '../types';
import { getCurrentTrack, getSpeakerList, sharedStyle, stylable } from '../utils';

class PlayerHeader extends LitElement {
  @property() store!: Store;
  private hass!: HomeAssistant;
  private config!: CardConfig;
  private entity!: HassEntity;

  render() {
    ({ config: this.config, hass: this.hass, entity: this.entity } = this.store);
    const attributes = this.entity.attributes;
    const speakerList = getSpeakerList(this.store.groups[this.entity.entity_id]);
    let song = this.config.noMediaText ? this.config.noMediaText : '🎺 What do you want to play? 🥁';
    if (attributes.media_title) {
      song = getCurrentTrack(this.entity);
    }
    return html` <div style="${this.infoStyle()}">
      <div style="${this.entityStyle()}">${speakerList}</div>
      <div style="${this.songStyle()}">${song}</div>
      <div style="${this.artistAlbumStyle()}">${attributes.media_album_name}</div>
      <dev-sonos-progress .store=${this.store}></dev-sonos-progress>
    </div>`;
  }

  private infoStyle() {
    return stylable('player-info', this.config, {
      margin: '0.25rem',
      padding: '0.5rem',
      textAlign: 'center',
    });
  }

  private entityStyle() {
    return stylable('player-entity', this.config, {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      fontSize: '0.75rem',
      fontWeight: '500',
      color: 'var(--sonos-int-artist-album-text-color)',
      whiteSpace: 'wrap',
    });
  }

  private artistAlbumStyle() {
    return stylable('player-artist-album', this.config, {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      fontSize: '0.75rem',
      fontWeight: '300',
      color: 'var(--sonos-int-artist-album-text-color)',
      whiteSpace: 'wrap',
    });
  }

  private songStyle() {
    return stylable('player-song', this.config, {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      fontSize: '1.15rem',
      fontWeight: '400',
      color: 'var(--sonos-int-song-text-color)',
      whiteSpace: 'wrap',
    });
  }

  private noMediaTextStyle() {
    return stylable('no-media-text', this.config, {
      flexGrow: '1',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      margin: '0.25rem',
      padding: '0.5rem',
    });
  }

  static get styles() {
    return sharedStyle;
  }
}

customElements.define('dev-sonos-player-header', PlayerHeader);
