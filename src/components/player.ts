import { css, html, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';
import { getEntityName } from '../utils';

import { CardConfig, Members } from '../types';
import { HomeAssistant } from 'custom-card-helpers';

import { CustomSonosCard } from '../main';
import MediaControlService from '../services/media-control-service';
import { StyleInfo, styleMap } from 'lit-html/directives/style-map.js';

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
        this.getVolumeTemplate(member, getEntityName(this.hass, this.config, member), isGroup, true),
      );
    }
    return html`
      <div
        class="container"
        style="${this.backgroundImageStyle(
          activeStateObj.attributes.entity_picture,
          activeStateObj.attributes.media_title,
        )}"
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
              false,
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

  getVolumeTemplate(entity: string, name: string, isGroup: boolean, isGroupMember: boolean, members?: Members) {
    const volume = 100 * this.hass.states[entity].attributes.volume_level;
    let max = 100;
    let inputColor = 'rgb(211, 3, 32)';
    if (volume < 20) {
      max = 30;
      inputColor = 'rgb(72,187,14)';
    }
    const volumeMuted =
      members && Object.keys(members).length
        ? !Object.keys(members).some((member) => !this.hass.states[member].attributes.is_volume_muted)
        : this.hass.states[entity].attributes.is_volume_muted;
    return html`
      <div class="volume ${isGroupMember ? 'group-member-volume' : ''}">
        ${name ? html` <div class="volume-name">${name}</div>` : ''}
        <ha-icon
          style="--mdc-icon-size: 1.25rem; align-self: center"
          @click="${() => this.mediaControlService.volumeMute(entity, !volumeMuted, members)}"
          .icon=${volumeMuted ? 'mdi:volume-mute' : 'mdi:volume-high'}
        ></ha-icon>
        <div class="volume-slider">
          <div class="volume-level">
            <div style="flex: ${volume}">0%</div>
            ${volume > 0 && volume < 95
              ? html` <div style="flex: 2; font-weight: bold; font-size: 12px;">${Math.round(volume)}%</div>`
              : ''}
            <div style="flex: ${max - volume};text-align: right">${max}%</div>
          </div>
          <input
            type="range"
            .value="${volume}"
            @change="${(e: Event) =>
              this.mediaControlService.volumeSet(entity, (e?.target as HTMLInputElement)?.value, members)}"
            @click="${(e: Event) =>
              this.volumeClicked(volume, Number.parseInt((e?.target as HTMLInputElement)?.value), isGroup)}"
            min="0"
            max="${max}"
            class="volumeRange"
            style="background: linear-gradient(to right, ${inputColor} 0%, ${inputColor} ${(volume * 100) /
            max}%, rgb(211, 211, 211) ${(volume * 100) / max}%, rgb(211, 211, 211) 100%);"
          />
        </div>
      </div>
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

  private backgroundImageStyle(entityImage?: string, mediaTitle?: string) {
    let style: StyleInfo = {
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundSize: 'cover',
      backgroundImage: entityImage ? `url(${entityImage})` : '',
    };
    const overrides = this.config.mediaArtworkOverrides;
    if (mediaTitle && overrides) {
      const override = overrides.find(
        (value) => (!entityImage && value.ifMissing) || mediaTitle === value.mediaTitleEquals,
      );
      if (override) {
        style = {
          ...style,
          backgroundImage: override.imageUrl ? `url(${override.imageUrl})` : style.backgroundImage,
          backgroundSize: override.sizePercentage ? `${override.sizePercentage}%` : style.backgroundSize,
        };
      }
    }
    return styleMap(style);
  }

  static get styles() {
    return css`
      .container {
        margin-top: 1rem;
        position: relative;
        background: var(--sonos-int-background-color);
        border-radius: var(--sonos-int-border-radius);
        padding-bottom: 100%;
        border: var(--sonos-int-border-width) solid var(--sonos-int-color);
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
        color: var(--sonos-int-song-text-color);
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
      .volume {
        display: flex;
      }
      .volume-name {
        margin-top: 1rem;
        margin-left: 0.4rem;
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .volume-slider {
        flex: 4;
      }
      .volume-level {
        font-size: x-small;
        margin: 0 0.4rem;
        display: flex;
      }
      .group-member-volume {
        border-top: dotted var(--sonos-int-color);
        margin-top: 0.4rem;
      }
      .mute {
        --mdc-icon-size: 1.25rem;
        align-self: center;
      }
    `;
  }
}

customElements.define('sonos-player', Player);
