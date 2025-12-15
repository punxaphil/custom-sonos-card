import { css, html, LitElement, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import Store from '../model/store';
import { PlayerConfig } from '../types';
import { getSpeakerList } from '../utils/utils';
import { MediaPlayer } from '../model/media-player';
import { until } from 'lit-html/directives/until.js';
import { when } from 'lit/directives/when.js';
import { styleMap } from 'lit/directives/style-map.js';

class PlayerHeader extends LitElement {
  @property({ attribute: false }) store!: Store;
  private config!: PlayerConfig;
  private activePlayer!: MediaPlayer;

  render() {
    this.config = this.store.config.player ?? {};
    this.activePlayer = this.store.activePlayer;
    const entityStyle = this.config.headerEntityFontSize ? { fontSize: `${this.config.headerEntityFontSize}rem` } : {};
    const songStyle = this.config.headerSongFontSize ? { fontSize: `${this.config.headerSongFontSize}rem` } : {};

    return html` <div class="info">
      <div class="entity" style=${styleMap(entityStyle)} hide=${this.config.hideEntityName || nothing}>
        ${getSpeakerList(this.activePlayer, this.store.predefinedGroups)}
      </div>
      <div class="song" style=${styleMap(songStyle)}>${this.getSong()}</div>
      <div class="artist-album" hide=${this.config.hideArtistAlbum || nothing}>
        ${this.getAlbum()} ${when(this.config.showAudioInputFormat, () => until(this.getAudioInputFormat()))}
      </div>
      <sonos-progress .store=${this.store}></sonos-progress>
    </div>`;
  }

  private getSong() {
    let song = this.activePlayer.getCurrentTrack();
    song = song || this.config.labelWhenNoMediaIsSelected || 'No media selected';
    if (this.config.showSource && this.activePlayer.attributes.source) {
      song = `${song} (${this.activePlayer.attributes.source})`;
    }
    return song;
  }

  private getAlbum() {
    let album = this.activePlayer.attributes.media_album_name;
    if (this.config.showChannel && this.activePlayer.attributes.media_channel) {
      album = this.activePlayer.attributes.media_channel;
    } else if (!this.config.hidePlaylist && this.activePlayer.attributes.media_playlist) {
      album = `${this.activePlayer.attributes.media_playlist} - ${album}`;
    }
    return album;
  }

  private async getAudioInputFormat() {
    const sensors = await this.store.hassService.getRelatedEntities(this.activePlayer, 'sensor');
    const audioInputFormat = sensors.find((sensor) => sensor.entity_id.includes('audio_input_format'));
    return audioInputFormat && audioInputFormat.state && audioInputFormat.state !== 'No audio'
      ? html`<span class="audio-input-format">${audioInputFormat.state}</span>`
      : '';
  }

  static get styles() {
    return css`
      .info {
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

      .audio-input-format {
        color: var(--card-background-color);
        background: var(--disabled-text-color);
        white-space: nowrap;
        font-size: smaller;
        line-height: normal;
        padding: 3px;
        margin-left: 8px;
      }

      *[hide] {
        display: none;
      }
    `;
  }
}

customElements.define('sonos-player-header', PlayerHeader);
