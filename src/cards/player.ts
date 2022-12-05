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
import '../components/player-header';
import '../components/volume';

import { CardConfig, Members } from '../types';
import { StyleInfo } from 'lit-html/directives/style-map.js';
import { HassEntity } from 'home-assistant-js-websocket';
import { until } from 'lit-html/directives/until.js';
import { when } from 'lit/directives/when.js';
import { DirectiveResult } from 'lit/directive.js';
import HassService from '../services/hass-service';
import MediaControlService from '../services/media-control-service';
import { HomeAssistant } from 'custom-card-helpers';

export class Player extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property() config!: CardConfig;
  private mediaControlService!: MediaControlService;
  private hassService!: HassService;
  private entity!: HassEntity;
  private isGroup!: boolean;
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
      this.isGroup = getGroupMembers(this.entity).length > 1;
      let allVolumes = [];
      if (this.isGroup) {
        allVolumes = getGroupMembers(this.entity).map((entityId: string) => this.groupMemberVolume(entityId));
      }

      const cardHtml = html`
        <div style="${this.containerStyle(this.entity)}">
          <div style="${this.bodyStyle()}">
            ${when(
              !this.showVolumes,
              () => html`<sonos-player-header
                .hass=${this.hass}
                .entity=${this.entity}
                .config=${this.config}
              ></sonos-player-header>`,
            )}
            <div style="${this.footerStyle()}" id="footer">
              <div ?hidden="${!this.showVolumes}">${allVolumes}</div>
              <div style="${this.iconsStyle()}">
                ${this.footerIcon('mdi:volume-minus', async () => await this.volumeDownClicked())}
                ${this.footerIcon('mdi:skip-backward', async () => await this.mediaControlService.prev(this.entityId))}
                ${this.entity.state !== 'playing'
                  ? this.footerIcon('mdi:play', async () => await this.mediaControlService.play(this.entityId))
                  : this.footerIcon('mdi:stop', async () => await this.mediaControlService.pause(this.entityId))}
                ${this.footerIcon('mdi:skip-forward', async () => await this.mediaControlService.next(this.entityId))}
                ${this.footerIcon(this.shuffleIcon(), async () => await this.shuffleClicked())}
                ${this.footerIcon(this.repeatIcon(), async () => await this.repeatClicked())}
                ${until(this.getAdditionalSwitches())}
                ${this.footerIcon(this.allVolumesIcon(), () => this.toggleShowAllVolumes(), !this.isGroup)}
                ${this.footerIcon('mdi:volume-plus', async () => await this.volumeUp())}
              </div>
              ${this.mainVolume()}
            </div>
          </div>
        </div>
      `;
      return wrapInHaCardUnlessAllSectionsShown(cardHtml, this.config);
    }
    return noPlayerHtml;
  }

  private volumeDownClicked = async () => {
    await this.mediaControlService.volumeDown(this.entityId, this.members);
  };

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

  private footerIcon(icon: string, click: () => void, hidden = false, additionalStyle?: StyleInfo) {
    return this.clickableIcon(icon, click, hidden, this.iconStyle(additionalStyle));
  }
  private clickableIcon(icon: string, click: () => void, hidden = false, style?: DirectiveResult) {
    return html`
      <ha-icon @click="${click}" style="${style}" class="hoverable" .icon=${icon} ?hidden="${hidden}"></ha-icon>
    `;
  }
  private getAdditionalSwitches() {
    if (!this.config.skipAdditionalPlayerSwitches) {
      return this.hassService.getRelatedSwitchEntities(this.entityId).then((items: string[]) => {
        return items.map((item: string) => {
          return this.footerIcon(
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

  private volumeClicked = () => {
    if (this.isGroup) {
      this.toggleShowAllVolumes();
    }
  };

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

  private volumeStyle(showVolumes: boolean, isGroup: boolean) {
    return stylable('player-volume', this.config, {
      flex: showVolumes ? '4' : '1',
      ...(isGroup && {
        borderBottom: 'dotted var(--sonos-int-color)',
        marginTop: '0.4rem',
      }),
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

  private volumeNameStyle(hidden: boolean) {
    return stylable('player-volume-name', this.config, {
      marginTop: '1rem',
      marginLeft: '0.4rem',
      flex: '1',
      overflow: 'hidden',
      flexDirection: 'column',
      ...(hidden && { display: 'none' }),
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

  private mainVolume() {
    const name = this.config.allVolumesText ? this.config.allVolumesText : 'All';
    return this.volume(this.entityId, name, this.members);
  }

  private groupMemberVolume(entityId: string) {
    const name = getEntityName(this.hass, this.config, entityId);
    return this.volume(entityId, name);
  }
  private volume(entityId: string, name: string, members?: Members) {
    return html` <div style="display: flex">
      <div style="${this.volumeNameStyle(!this.showVolumes)}">
        <div style="${this.volumeNameTextStyle()}">${name}</div>
        ${this.clickableIcon('mdi:arrow-left', () => (this.showVolumes = false), !members, this.volumeNameIconStyle())}
      </div>
      <sonos-volume
        .hass=${this.hass}
        .entityId=${entityId}
        .config=${this.config}
        .members=${members}
        style="${this.volumeStyle(this.showVolumes, !members)}"
        @volumeClicked=${this.volumeClicked}
      ></sonos-volume>
    </div>`;
  }
}
