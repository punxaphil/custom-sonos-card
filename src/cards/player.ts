import { css, html, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';
import {
  createPlayerGroups,
  getEntityName,
  getGroupMembers,
  getMediaPlayers,
  listenForEntityId,
  noPlayerHtml,
  sharedStyle,
  stopListeningForEntityId,
  stylable,
  validateConfig,
  wrapInHaCardUnlessAllSectionsShown,
} from '../utils';
import '../components/progress';

import { CardConfig, Members } from '../types';
import { StyleInfo } from 'lit-html/directives/style-map.js';
import { HassEntity } from 'home-assistant-js-websocket';
import { until } from 'lit-html/directives/until.js';
import { when } from 'lit/directives/when.js';
import HassService from '../services/hass-service';
import MediaControlService from '../services/media-control-service';
import { HomeAssistant } from 'custom-card-helpers';

export class Player extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property() config!: CardConfig;
  private mediaControlService!: MediaControlService;
  private hassService!: HassService;
  private entity!: HassEntity;
  @state() private members!: Members;
  @state() private entityId!: string;
  @state() showVolumes!: boolean;
  @state() private timerToggleShowAllVolumes!: number;

  entityIdListener = (event: Event) => {
    const newEntityId = (event as CustomEvent).detail.entityId;
    if (newEntityId !== this.entityId) {
      this.entityId = newEntityId;
      this.showVolumes = false;
    }
  };

  connectedCallback() {
    super.connectedCallback();
    listenForEntityId(this.entityIdListener);
  }

  disconnectedCallback() {
    stopListeningForEntityId(this.entityIdListener);
    super.disconnectedCallback();
  }

  setConfig(config: CardConfig) {
    const parsed = JSON.parse(JSON.stringify(config));
    validateConfig(parsed);
    this.config = parsed;
  }

  render() {
    if (!this.entityId && this.config.entityId) {
      this.entityId = this.config.entityId;
    }
    if (this.entityId && this.hass) {
      this.entity = this.hass.states[this.entityId];
      this.hassService = new HassService(this.hass);
      this.mediaControlService = new MediaControlService(this.hass, this.hassService);
      const mediaPlayers = getMediaPlayers(this.config, this.hass);
      const groups = createPlayerGroups(mediaPlayers, this.hass, this.config);
      this.members = groups[this.entityId].members;
      const entityAttributes = this.entity?.attributes;
      const isGroup = getGroupMembers(this.entity).length > 1;
      let allVolumes = [];
      if (isGroup) {
        allVolumes = getGroupMembers(this.entity).map((member: string) =>
          this.getVolumeTemplate(member, getEntityName(this.hass, this.config, member), isGroup, true),
        );
      }

      const cardHtml = html`
        <div style="${this.containerStyle(this.entity)}">
          <div style="${this.bodyStyle()}">
            ${when(!this.showVolumes, () =>
              entityAttributes.media_title
                ? html`
                    <div style="${this.infoStyle()}">
                      <div style="${this.artistAlbumStyle()}">${entityAttributes.media_album_name}</div>
                      <div style="${this.songStyle()}">${entityAttributes.media_title}</div>
                      <div style="${this.artistAlbumStyle()}">${entityAttributes.media_artist}</div>
                      <sonos-progress
                        .hass=${this.hass}
                        .entityId=${this.entityId}
                        .config=${this.config}
                      ></sonos-progress>
                    </div>
                  `
                : html` <div style="${this.noMediaTextStyle()}">
                    ${this.config.noMediaText ? this.config.noMediaText : '🎺 What do you want to play? 🥁'}
                  </div>`,
            )}
            <div style="${this.footerStyle()}" id="footer">
              <div ?hidden="${!this.showVolumes}">${allVolumes}</div>
              <div style="${this.iconsStyle()}">
                ${this.clickableIcon('mdi:volume-minus', async () => await this.volumeDownClicked())}
                ${this.clickableIcon(
                  'mdi:skip-backward',
                  async () => await this.mediaControlService.prev(this.entityId),
                )}
                ${this.entity.state !== 'playing'
                  ? this.clickableIcon('mdi:play', async () => await this.mediaControlService.play(this.entityId))
                  : this.clickableIcon('mdi:stop', async () => await this.mediaControlService.pause(this.entityId))}
                ${this.clickableIcon(
                  'mdi:skip-forward',
                  async () => await this.mediaControlService.next(this.entityId),
                )}
                ${this.clickableIcon(this.shuffleIcon(), async () => await this.shuffleClicked())}
                ${this.clickableIcon(this.repeatIcon(), async () => await this.repeatClicked())}
                ${until(this.getAdditionalSwitches())}
                ${this.clickableIcon(this.allVolumesIcon(), () => this.toggleShowAllVolumes(), !isGroup)}
                ${this.clickableIcon('mdi:volume-plus', async () => await this.volumeUp())}
              </div>
              ${this.getVolumeTemplate(
                this.entityId,
                this.showVolumes ? (this.config.allVolumesText ? this.config.allVolumesText : 'All') : '',
                isGroup,
                false,
                this.members,
              )}
            </div>
          </div>
        </div>
      `;
      return wrapInHaCardUnlessAllSectionsShown(cardHtml, this.config);
    }
    return noPlayerHtml;
  }

  private async volumeDownClicked() {
    await this.mediaControlService.volumeDown(this.entityId, this.members);
  }

  private allVolumesIcon() {
    return this.showVolumes ? 'mdi:arrow-collapse-vertical' : 'mdi:arrow-expand-vertical';
  }

  private shuffleIcon() {
    return this.entity?.attributes.shuffle ? 'mdi:shuffle-variant' : 'mdi:shuffle-disabled';
  }

  private async shuffleClicked() {
    await this.mediaControlService.shuffle(this.entityId, !this.entity?.attributes.shuffle);
  }

  private async repeatClicked() {
    await this.mediaControlService.repeat(this.entityId, this.entity?.attributes.repeat);
  }

  private repeatIcon() {
    const repeatState = this.entity?.attributes.repeat;
    return repeatState === 'all' ? 'mdi:repeat' : repeatState === 'one' ? 'mdi:repeat-once' : 'mdi:repeat-off';
  }

  private async volumeUp() {
    await this.mediaControlService.volumeUp(this.entityId, this.members);
  }

  private clickableIcon(icon: string, click: () => void, hidden = false, additionalStyle?: StyleInfo) {
    return html`
      <ha-icon
        @click="${click}"
        style="${this.iconStyle(additionalStyle)}"
        class="hoverable"
        .icon=${icon}
        ?hidden="${hidden}"
      ></ha-icon>
    `;
  }

  getVolumeTemplate(entity: string, name: string, isGroup: boolean, isGroupMember: boolean, members?: Members) {
    const volume = 100 * this.hass.states[entity].attributes.volume_level;
    let max = 100;
    let inputColor = 'rgb(211, 3, 32)';
    if (volume < 20) {
      if (!this.config.disableDynamicVolumeSlider) {
        max = 30;
      }
      inputColor = 'rgb(72,187,14)';
    }
    const volumeMuted =
      members && Object.keys(members).length
        ? !Object.keys(members).some((member) => !this.hass.states[member].attributes.is_volume_muted)
        : this.hass.states[entity].attributes.is_volume_muted;
    return html`
      <div style="${this.volumeStyle(isGroupMember)}">
        ${name
          ? html`<div style="${this.volumeNameStyle()}">
              <div style="${this.volumeNameTextStyle()}">${name}</div>
              ${when(
                isGroup && !isGroupMember,
                () => html`<ha-icon
                  .icon=${'mdi:arrow-left'}
                  @click="${() => (this.showVolumes = false)}"
                  class="hoverable"
                  style="${this.volumeNameIconStyle()}"
                ></ha-icon>`,
              )}
            </div>`
          : ''}
        <ha-icon
          style="${this.muteStyle()}"
          @click="${async () => await this.mediaControlService.volumeMute(entity, !volumeMuted, members)}"
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
          <ha-slider
            value="${volume}"
            @change="${async (e: Event) =>
              await this.mediaControlService.volumeSet(entity, (e?.target as HTMLInputElement)?.value, members)}"
            @click="${(e: Event) => {
              this.volumeClicked(volume, Number.parseInt((e?.target as HTMLInputElement)?.value), isGroup);
              e.stopPropagation();
            }}"
            min="0"
            max="${max}"
            step=${this.config.volume_step || 1}
            dir=${'ltr'}
            pin
            style="${this.volumeRangeStyle(inputColor)}"
          >
          </ha-slider>
        </div>
      </div>
    `;
  }

  private getAdditionalSwitches() {
    if (!this.config.skipAdditionalPlayerSwitches) {
      return this.hassService.getRelatedSwitchEntities(this.entityId).then((items: string[]) => {
        return items.map((item: string) => {
          return this.clickableIcon(
            this.hass.states[item].attributes.icon || '',
            () => this.hassService.toggle(item),
            false,
            this.hass.states[item].state === 'on' ? { color: 'var(--sonos-int-accent-color)' } : {},
          );
        });
      });
    }
    return '';
  }

  private volumeClicked(oldVolume: number, newVolume: number, isGroup: boolean) {
    if (isGroup && oldVolume === newVolume) {
      this.toggleShowAllVolumes();
    }
  }

  toggleShowAllVolumes() {
    this.showVolumes = !this.showVolumes;
    clearTimeout(this.timerToggleShowAllVolumes);
    if (this.showVolumes) {
      this.scrollToBottomOfFooter();
      this.timerToggleShowAllVolumes = window.setTimeout(() => {
        this.showVolumes = false;
        window.scrollTo(0, 0);
      }, 30000);
    }
  }

  private scrollToBottomOfFooter() {
    setTimeout(() => {
      const footer = this.renderRoot?.querySelector('#footer');
      if (footer) {
        footer.scrollTop = footer.scrollHeight;
      }
    });
  }

  private containerStyle(entityState: HassEntity) {
    const entityImage = entityState.attributes.entity_picture;
    const mediaTitle = entityState.attributes.media_title;
    const mediaContentId = entityState.attributes.media_content_id;
    let style: StyleInfo = {
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundSize: 'cover',
      backgroundImage: entityImage ? `url(${entityImage})` : '',
    };
    const overrides = this.config.mediaArtworkOverrides;
    if (overrides) {
      let override = overrides.find(
        (value) => mediaTitle === value.mediaTitleEquals || mediaContentId === value.mediaContentIdEquals,
      );
      if (!override) {
        override = overrides.find((value) => !entityImage && value.ifMissing);
      }
      if (override) {
        style = {
          ...style,
          backgroundImage: override.imageUrl ? `url(${override.imageUrl})` : style.backgroundImage,
          backgroundSize: override.sizePercentage ? `${override.sizePercentage}%` : style.backgroundSize,
        };
      }
    }
    return stylable('player-container', this.config, {
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
    return stylable('player-body', this.config, {
      position: 'absolute',
      inset: '0px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: this.showVolumes ? 'flex-end' : 'space-between',
    });
  }

  private footerStyle() {
    return stylable('player-footer', this.config, {
      background: 'var(--sonos-int-player-section-background)',
      margin: '0.25rem',
      padding: '0.5rem',
      borderRadius: 'var(--sonos-int-border-radius)',
      overflow: 'hidden auto',
    });
  }

  private iconsStyle() {
    return stylable('player-footer-icons', this.config, {
      justifyContent: 'space-between',
      display: this.showVolumes ? 'none' : 'flex',
    });
  }

  private iconStyle(additionalStyle?: StyleInfo) {
    return stylable('player-footer-icon', this.config, {
      padding: '0.3rem',
      '--mdc-icon-size': 'min(100%, 1.25rem)',
      ...additionalStyle,
    });
  }

  private volumeRangeStyle(inputColor: string) {
    return stylable('player-volume-range', this.config, {
      width: '105%',
      marginLeft: '-3%',
      '--paper-progress-active-color': inputColor,
      '--paper-slider-knob-color': inputColor,
      '--paper-slider-height': '0.3rem',
    });
  }

  private infoStyle() {
    return stylable('player-info', this.config, {
      margin: '0.25rem',
      padding: '0.5rem',
      textAlign: 'center',
      background: 'var(--sonos-int-player-section-background)',
      borderRadius: 'var(--sonos-int-border-radius)',
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
      justifyContent: 'center',
      alignItems: 'center',
    });
  }

  private volumeStyle(isGroupMember: boolean) {
    return stylable('player-volume', this.config, {
      display: 'flex',
      ...(isGroupMember && {
        borderBottom: 'dotted var(--sonos-int-color)',
        marginTop: '0.4rem',
      }),
    });
  }

  private volumeNameStyle() {
    return stylable('player-volume-name', this.config, {
      marginTop: '1rem',
      marginLeft: '0.4rem',
      flex: '1',
      overflow: 'hidden',
      flexDirection: 'column',
    });
  }

  private volumeNameTextStyle() {
    return stylable('player-volume-name-text', this.config, {
      flex: '1',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    });
  }

  private volumeNameIconStyle() {
    return stylable('player-volume-name-icon', this.config, {
      flex: '1',
      '--mdc-icon-size': '1.5rem',
      marginLeft: '-0.3rem',
    });
  }

  private volumeSliderStyle() {
    return stylable('player-volume-slider', this.config, {
      flex: '4',
    });
  }

  private volumeLevelStyle() {
    return stylable('player-volume-level', this.config, {
      fontSize: 'x-small',
      display: 'flex',
    });
  }

  private muteStyle() {
    return stylable('player-mute', this.config, {
      '--mdc-icon-size': '1.25rem',
      alignSelf: 'center',
      marginRight: '0.7rem',
    });
  }

  static get styles() {
    return [
      css`
        .hoverable:focus,
        .hoverable:hover {
          color: var(--sonos-int-accent-color);
        }
      `,
      sharedStyle,
    ];
  }
}
