import { css, html, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';
import { getEntityName } from '../utils';

import { CardConfig, Members } from '../types';
import { HomeAssistant } from 'custom-card-helpers';

import { CustomSonosCard } from '../main';
import MediaControlService from '../services/media-control-service';

class Player extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property() config!: CardConfig;
  @property() entityId!: string;
  @property() mediaControlService!: MediaControlService;
  @property() members!: Members;
  @property() main!: CustomSonosCard;
  @state() private timerToggleShowAllVolumes!: number;

  render() {
    const activeStateObj = this.hass.states[this.entityId];
    const isGroup = activeStateObj.attributes.sonos_group.length > 1;
    let allVolumes = [];
    if (isGroup) {
      allVolumes = activeStateObj.attributes.sonos_group.map((member: string) =>
        this.getVolumeTemplate(member, getEntityName(this.hass, this.config, member), isGroup),
      );
    }
    return html`
      <div
        class="container"
        style="${activeStateObj.attributes.entity_picture
          ? `background-image: url(${activeStateObj.attributes.entity_picture});`
          : ''}"
      >
        <div class="body">
          ${activeStateObj.attributes.media_title
            ? html`
                <div class="info">
                  <div class="album">${activeStateObj.attributes.media_album_name}</div>
                  <div class="song">${activeStateObj.attributes.media_title}</div>
                  <div class="artist">${activeStateObj.attributes.media_artist}</div>
                </div>
              `
            : html` <div class="noMediaText">
                ${this.config.noMediaText ? this.config.noMediaText : '🎺 What do you want to play? 🥁'}
              </div>`}
          <div class="footer">
            ${this.getVolumeTemplate(
              this.entityId,
              this.main.showVolumes ? (this.config.allVolumesText ? this.config.allVolumesText : 'All') : '',
              isGroup,
              this.members,
            )}
            <div style="display: ${this.main.showVolumes ? 'block' : 'none'}">${allVolumes}</div>
            <div class="footer-icons">
              <ha-icon
                @click="${() => this.mediaControlService.volumeDown(this.entityId, this.members)}"
                .icon=${'mdi:volume-minus'}
              ></ha-icon>
              <ha-icon
                @click="${() => this.mediaControlService.prev(this.entityId)}"
                .icon=${'mdi:skip-backward'}
              ></ha-icon>
              ${activeStateObj.state !== 'playing'
                ? html` <ha-icon
                    @click="${() => this.mediaControlService.play(this.entityId)}"
                    .icon=${'mdi:play'}
                  ></ha-icon>`
                : html`
                    <ha-icon
                      @click="${() => this.mediaControlService.pause(this.entityId)}"
                      .icon=${'mdi:stop'}
                    ></ha-icon>
                  `}
              <ha-icon
                @click="${() => this.mediaControlService.next(this.entityId)}"
                .icon=${'mdi:skip-forward'}
              ></ha-icon>
              <ha-icon
                @click="${() => this.mediaControlService.shuffle(this.entityId, !activeStateObj.attributes.shuffle)}"
                .icon=${activeStateObj.attributes.shuffle ? 'mdi:shuffle-variant' : 'mdi:shuffle-disabled'}
              ></ha-icon>
              <ha-icon
                @click="${() => this.mediaControlService.repeat(this.entityId, activeStateObj.attributes.repeat)}"
                .icon=${activeStateObj.attributes.repeat === 'all'
                  ? 'mdi:repeat'
                  : activeStateObj.attributes.repeat === 'one'
                  ? 'mdi:repeat-once'
                  : 'mdi:repeat-off'}
              ></ha-icon>
              <ha-icon
                style="display: ${isGroup ? 'block' : 'none'}"
                @click="${() => this.toggleShowAllVolumes()}"
                .icon=${this.main.showVolumes ? 'mdi:arrow-collapse-vertical' : 'mdi:arrow-expand-vertical'}
              ></ha-icon>
              <ha-icon
                @click="${() => this.mediaControlService.volumeUp(this.entityId, this.members)}"
                .icon=${'mdi:volume-plus'}
              ></ha-icon>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  getVolumeTemplate(entity: string, name: string, isGroup: boolean, members = {}) {
    const volume = 100 * this.hass.states[entity].attributes.volume_level;
    let max = 100;
    let inputColor = 'rgb(211, 3, 32)';
    if (volume < 20) {
      max = 30;
      inputColor = 'rgb(72,187,14)';
    }
    return html`
      ${name ? html` <div style="margin-top: 1rem; margin-left: 0.4rem;">${name}</div>` : ''}
      <div style="font-size: x-small; margin: 0 0.4rem; display: flex;">
        <div style="flex: ${volume}">0%</div>
        ${volume > 0 ? html` <div style="flex: 2">${Math.round(volume)}%</div>` : ''}
        <div style="flex: ${max - volume};text-align: right">${max}%</div>
      </div>
      <input
        type="range"
        .value="${volume}"
        @change="${(e: Event) =>
          this.mediaControlService.volumeSet(entity, members, (e?.target as HTMLInputElement)?.value)}"
        @click="${(e: Event) =>
          this.volumeClicked(volume, Number.parseInt((e?.target as HTMLInputElement)?.value), isGroup)}"
        min="0"
        max="${max}"
        id="volumeRange"
        class="volumeRange"
        style="background: linear-gradient(to right, ${inputColor} 0%, ${inputColor} ${(volume * 100) /
        max}%, rgb(211, 211, 211) ${(volume * 100) / max}%, rgb(211, 211, 211) 100%);"
      />
    `;
  }

  private volumeClicked(oldVolume: number, newVolume: number, isGroup: boolean) {
    if (isGroup && oldVolume === newVolume) {
      this.toggleShowAllVolumes();
    }
  }

  toggleShowAllVolumes() {
    this.main.showVolumes = !this.main.showVolumes;
    clearTimeout(this.timerToggleShowAllVolumes);
    if (this.main.showVolumes) {
      this.timerToggleShowAllVolumes = window.setTimeout(() => {
        this.main.showVolumes = false;
        window.scrollTo(0, 0);
      }, 30000);
    }
  }

  static get styles() {
    return css`
      .container {
        margin-top: 1rem;
        position: relative;
        background: var(--sonos-int-background-color);
        border-radius: var(--sonos-int-border-radius);
        box-shadow: var(--sonos-int-box-shadow);
        padding-bottom: 100%;
        border: var(--sonos-int-border-width) solid var(--sonos-int-background-color);
        background-position-x: center;
        background-repeat: no-repeat;
        background-size: cover;
      }

      .body {
        position: absolute;
        inset: 0px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }

      .footer {
        background: var(--sonos-int-player-section-background);
        margin: 0.25rem;
        padding: 0.5rem;
        border-radius: var(--sonos-int-border-radius);
        overflow: hidden auto;
      }

      .footer input {
        width: 97%;
      }

      .footer-icons {
        justify-content: space-between;
        display: flex;
      }

      .footer div ha-icon {
        padding: 0.3rem;
        --mdc-icon-size: min(100%, 1.25rem);
      }

      .volumeRange {
        -webkit-appearance: none;
        height: 0.25rem;
        border-radius: var(--sonos-int-border-radius);
        outline: none;
        opacity: 0.7;
        -webkit-transition: 0.2s;
        transition: opacity 0.2s;
        margin: 0.25rem 0.25rem 0 0.25rem;
      }

      .info {
        margin: 0.25rem;
        padding: 0.5rem;
        text-align: center;
        background: var(--sonos-int-player-section-background);
        border-radius: var(--sonos-int-border-radius);
      }

      .artist,
      .album {
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: 0.75rem;
        font-weight: 300;
        color: var(--sonos-int-artist-album-text-color);
        white-space: wrap;
      }

      .song {
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: 1.15rem;
        font-weight: 400;
        color: var(--sonos-int-accent-color);
        white-space: wrap;
      }

      ha-icon:focus,
      ha-icon:hover {
        color: var(--sonos-int-accent-color);
      }

      .noMediaText {
        flex-grow: 1;
        display: flex;
        justify-content: center;
        align-items: center;
      }
    `;
  }
}

customElements.define('sonos-player', Player);
