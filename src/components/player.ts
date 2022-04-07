import { css, html, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';
import { getEntityName } from '../utils';

import { CardConfig, Members } from '../types';
import { HomeAssistant } from 'custom-card-helpers';

import { CustomSonosCard } from '../main';
import MediaControlService from '../services/media-control-service';
import { StyleInfo } from 'lit-html/directives/style-map.js';
import { HassEntity } from 'home-assistant-js-websocket';

class Player extends LitElement {
  @property() main!: CustomSonosCard;
  @property() members!: Members;
  private hass!: HomeAssistant;
  private config!: CardConfig;
  private entityId!: string;
  private mediaControlService!: MediaControlService;
  @state() private timerToggleShowAllVolumes!: number;

  render() {
    this.hass = this.main.hass;
    this.entityId = this.main.activePlayer;
    this.config = this.main.config;
    this.mediaControlService = this.main.mediaControlService;
    const entityAttributes = this.getEntityAttributes();
    const isGroup = entityAttributes.sonos_group.length > 1;
    let allVolumes = [];
    if (isGroup) {
      allVolumes = entityAttributes.sonos_group.map((member: string) =>
        this.getVolumeTemplate(member, getEntityName(this.hass, this.config, member), isGroup, true),
      );
    }
    return html`
      <div style="${this.containerStyle(this.hass.states[this.entityId])}">
        <div style="${this.bodyStyle()}">
          ${entityAttributes.media_title
            ? html`
                <div style="${this.infoStyle()}">
                  <div style="${this.artistAlbumStyle()}">${entityAttributes.media_album_name}</div>
                  <div style="${this.songStyle()}">${entityAttributes.media_title}</div>
                  <div style="${this.artistAlbumStyle()}">${entityAttributes.media_artist}</div>
                </div>
              `
            : html` <div style="${this.noMediaTextStyle()}">
                ${this.config.noMediaText ? this.config.noMediaText : '🎺 What do you want to play? 🥁'}
              </div>`}
          <div style="${this.footerStyle()}">
            ${this.getVolumeTemplate(
              this.entityId,
              this.main.showVolumes ? (this.config.allVolumesText ? this.config.allVolumesText : 'All') : '',
              isGroup,
              false,
              this.members,
            )}
            <div ?hidden="${!this.main.showVolumes}">${allVolumes}</div>
            <div style="${this.iconsStyle()}">
              ${this.clickableIcon('mdi:volume-minus', () => this.volumeDownClicked())}
              ${this.clickableIcon('mdi:skip-backward', () => this.mediaControlService.prev(this.entityId))}
              ${this.hass.states[this.entityId].state !== 'playing'
                ? this.clickableIcon('mdi:play', () => this.mediaControlService.play(this.entityId))
                : this.clickableIcon('mdi:stop', () => this.mediaControlService.pause(this.entityId))}
              ${this.clickableIcon('mdi:skip-forward', () => this.mediaControlService.next(this.entityId))}
              ${this.clickableIcon(this.shuffleIcon(), () => this.shuffleClicked())}
              ${this.clickableIcon(this.repeatIcon(), () => this.repeatClicked())}
              ${this.clickableIcon(this.allVolumesIcon(), () => this.toggleShowAllVolumes(), !isGroup)}
              ${this.clickableIcon('mdi:volume-plus', () => this.volumeUp())}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private volumeDownClicked() {
    this.mediaControlService.volumeDown(this.entityId, this.members);
  }

  private allVolumesIcon() {
    return this.main.showVolumes ? 'mdi:arrow-collapse-vertical' : 'mdi:arrow-expand-vertical';
  }

  private shuffleIcon() {
    return this.getEntityAttributes().shuffle ? 'mdi:shuffle-variant' : 'mdi:shuffle-disabled';
  }

  private shuffleClicked() {
    this.mediaControlService.shuffle(this.entityId, !this.getEntityAttributes().shuffle);
  }

  private repeatClicked() {
    this.mediaControlService.repeat(this.entityId, this.getEntityAttributes().repeat);
  }

  private repeatIcon() {
    const entityState = this.hass.states[this.entityId];
    return entityState.attributes.repeat === 'all'
      ? 'mdi:repeat'
      : entityState.attributes.repeat === 'one'
      ? 'mdi:repeat-once'
      : 'mdi:repeat-off';
  }

  private volumeUp() {
    this.mediaControlService.volumeUp(this.entityId, this.members);
  }

  private clickableIcon(icon: string, click: () => void, hidden = false) {
    return html`
      <ha-icon
        @click="${click}"
        style="${this.iconStyle()}"
        class="hoverable"
        .icon=${icon}
        ?hidden="${hidden}"
      ></ha-icon>
    `;
  }

  private getEntityAttributes() {
    return this.hass.states[this.entityId].attributes;
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
      <div style="${this.volumeStyle(isGroupMember)}">
        ${name ? html` <div style="${this.volumeNameStyle()}">${name}</div>` : ''}
        <ha-icon
          style="${this.muteStyle()}"
          @click="${() => this.mediaControlService.volumeMute(entity, !volumeMuted, members)}"
          .icon=${volumeMuted ? 'mdi:volume-mute' : 'mdi:volume-high'}
        ></ha-icon>
        <div style="${this.volumeSliderStyle()}">
          <div style="${this.volumeLevelStyle()}">
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
            style="${this.volumeRangeStyle(inputColor, volume, max)}"
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

  private containerStyle(entityState: HassEntity) {
    const entityImage = entityState.attributes.entity_picture;
    const mediaTitle = entityState.attributes.media_title;
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
    return this.main.stylable('player-container', {
      marginTop: '1rem',
      position: 'relative',
      background: 'var(--sonos-int-background-color)',
      borderRadius: 'var(--sonos-int-border-radius)',
      paddingBottom: '100%',
      border: 'var(--sonos-int-border-width) solid var(--sonos-int-color)',
      ...style,
    });
  }

  private bodyStyle() {
    return this.main.stylable('player-body', {
      position: 'absolute',
      inset: '0px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    });
  }

  private footerStyle() {
    return this.main.stylable('player-footer', {
      background: 'var(--sonos-int-player-section-background)',
      margin: '0.25rem',
      padding: '0.5rem',
      borderRadius: 'var(--sonos-int-border-radius)',
      overflow: 'hidden auto',
    });
  }

  private iconsStyle() {
    return this.main.stylable('player-footer-icons', {
      justifyContent: 'space-between',
      display: 'flex',
    });
  }

  private iconStyle() {
    return this.main.stylable('player-footer-icon', {
      padding: '0.3rem',
      '--mdc-icon-size': 'min(100%, 1.25rem)',
    });
  }

  private volumeRangeStyle(inputColor: string, volume: number, max: number) {
    return this.main.stylable('player-volume-range', {
      '-webkit-appearance': 'none',
      height: '0.25rem',
      borderRadius: 'var(--sonos-int-border-radius)',
      outline: 'none',
      opacity: '0.7',
      '-webkit-transition': '0.2s',
      transition: 'opacity 0.2s',
      margin: '0.25rem 0.25rem 0 0.25rem',
      width: '97%',
      background: `linear-gradient(to right, ${inputColor} 0%, ${inputColor} ${
        (volume * 100) / max
      }%, rgb(211, 211, 211) ${(volume * 100) / max}%, rgb(211, 211, 211) 100%)`,
    });
  }

  private infoStyle() {
    return this.main.stylable('player-info', {
      margin: '0.25rem',
      padding: '0.5rem',
      textAlign: 'center',
      background: 'var(--sonos-int-player-section-background)',
      borderRadius: 'var(--sonos-int-border-radius)',
    });
  }

  private artistAlbumStyle() {
    return this.main.stylable('player-artist-album', {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      fontSize: '0.75rem',
      fontWeight: '300',
      color: 'var(--sonos-int-artist-album-text-color)',
      whiteSpace: 'wrap',
    });
  }

  private songStyle() {
    return this.main.stylable('player-song', {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      fontSize: '1.15rem',
      fontWeight: '400',
      color: 'var(--sonos-int-song-text-color)',
      whiteSpace: 'wrap',
    });
  }

  private noMediaTextStyle() {
    return this.main.stylable('no-media-text', {
      flexGrow: '1',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    });
  }

  private volumeStyle(isGroupMember: boolean) {
    return this.main.stylable('player-volume', {
      display: 'flex',
      ...(isGroupMember && {
        borderTop: 'dotted var(--sonos-int-color)',
        marginTop: '0.4rem',
      }),
    });
  }

  private volumeNameStyle() {
    return this.main.stylable('player-volume-name', {
      marginTop: '1rem',
      marginLeft: '0.4rem',
      flex: '1',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    });
  }

  private volumeSliderStyle() {
    return this.main.stylable('player-volume-slider', {
      flex: '4',
    });
  }

  private volumeLevelStyle() {
    return this.main.stylable('player-volume-level', {
      fontSize: 'x-small',
      margin: '0 0.4rem',
      display: 'flex',
    });
  }

  private muteStyle() {
    return this.main.stylable('player-mute', {
      '--mdc-icon-size': '1.25rem',
      alignSelf: 'center',
    });
  }

  static get styles() {
    return css`
      hoverable:focus,
      hoverable:hover {
        color: var(--sonos-int-accent-color);
      }
    `;
  }
}

customElements.define('sonos-player', Player);
