import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import Store from '../../model/store';
import { getSpeakerList } from '../../utils/utils';
import { until } from 'lit-html/directives/until.js';
import { when } from 'lit/directives/when.js';
import { styleMap } from 'lit/directives/style-map.js';

class PlayerHeader extends LitElement {
  @property({ attribute: false }) store!: Store;

  render() {
    const { headerEntityFontSize, headerSongFontSize, hideEntityName, hideArtistAlbum, showAudioInputFormat } = this.store.config.player ?? {};
    const entityStyle = headerEntityFontSize ? { fontSize: `${headerEntityFontSize}rem` } : {};
    const songStyle = headerSongFontSize ? { fontSize: `${headerSongFontSize}rem` } : {};

    return html` <div class="info">
      <div class="entity" style=${styleMap(entityStyle)} ?hidden=${!!hideEntityName}>
        ${getSpeakerList(this.store.activePlayer, this.store.predefinedGroups)}
      </div>
      <div class="song" style=${styleMap(songStyle)}>${this.getSong()}</div>
      <div class="artist-album" ?hidden=${!!hideArtistAlbum}>${this.getAlbum()} ${when(showAudioInputFormat, () => until(this.getAudioInputFormat()))}</div>
      <sonos-progress .store=${this.store}></sonos-progress>
    </div>`;
  }

  private getSong() {
    const { labelWhenNoMediaIsSelected, showSource } = this.store.config.player ?? {};
    let song = this.store.activePlayer.getCurrentTrack();
    song = song || labelWhenNoMediaIsSelected || 'No media selected';
    if (showSource && this.store.activePlayer.attributes.source) {
      song = `${song} (${this.store.activePlayer.attributes.source})`;
    }
    return song;
  }

  private getAlbum() {
    const { showChannel, hidePlaylist } = this.store.config.player ?? {};
    let album = this.store.activePlayer.attributes.media_album_name;
    if (showChannel && this.store.activePlayer.attributes.media_channel) {
      album = this.store.activePlayer.attributes.media_channel;
    } else if (!hidePlaylist && this.store.activePlayer.attributes.media_playlist) {
      album = `${this.store.activePlayer.attributes.media_playlist} - ${album}`;
    }
    return album;
  }

  private async getAudioInputFormat() {
    const sensors = await this.store.hassService.getRelatedEntities(this.store.activePlayer, 'sensor');
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
        font-size: var(--sonos-font-size, 1rem);
        font-weight: 500;
        color: var(--secondary-text-color);
        white-space: nowrap;
      }

      .song {
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: calc(var(--sonos-font-size, 1rem) * 1.15);
        font-weight: 400;
        color: var(--accent-color);
      }

      .artist-album {
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: var(--sonos-font-size, 1rem);
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

      [hidden] {
        display: none !important;
      }
    `;
  }
}

customElements.define('sonos-player-header', PlayerHeader);
