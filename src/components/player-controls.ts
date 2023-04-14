import { HomeAssistant } from 'custom-card-helpers';
import { HassEntity } from 'home-assistant-js-websocket';
import { html, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';
import HassService from '../services/hass-service';
import MediaControlService from '../services/media-control-service';
import Store from '../store';
import { CardConfig, Members, Section } from '../types';
import { dispatchShowSection, getGroupMembers, isPlaying, stylable } from '../utils';
import {
  mdiPauseCircle,
  mdiPlayCircle,
  mdiRepeat,
  mdiRepeatOff,
  mdiRepeatOnce,
  mdiShuffleDisabled,
  mdiShuffleVariant,
  mdiSkipNext,
  mdiSkipPrevious,
  mdiTune,
} from '@mdi/js';
import sharedStyle from '../sharedStyle';

class PlayerControls extends LitElement {
  @property() store!: Store;
  private hass!: HomeAssistant;
  private config!: CardConfig;
  @property()
  private entity!: HassEntity;

  private isGroup!: boolean;
  private entityId!: string;
  private mediaControlService!: MediaControlService;
  private hassService!: HassService;
  private members!: Members;
  @state() private timerToggleShowAllVolumes!: number;

  render() {
    ({
      config: this.config,
      hass: this.hass,
      entityId: this.entityId,
      entity: this.entity,
      mediaControlService: this.mediaControlService,
    } = this.store);
    this.members = this.store.groups[this.entityId].members;
    this.isGroup = getGroupMembers(this.entity).length > 1;
    const playing = isPlaying(this.entity.state);

    // ${until(this.getAdditionalSwitches())}

    return html`
      <div style="${this.mainStyle()}" id="mediaControls">
        <div style="${this.iconsStyle()}">
          <div style="flex:1"></div>
          <div style="display: flex;align-items: center;flex:1">
            <ha-icon-button
              @click="${this.shuffle}"
              .path=${this.shuffleIcon()}
              style="--mdc-icon-button-size: 2rem;--mdc-icon-size: 1.5rem;margin-right:1rem"
            ></ha-icon-button>
            <ha-icon-button
              @click="${this.prev}"
              .path=${mdiSkipPrevious}
              style="--mdc-icon-button-size: 2rem;--mdc-icon-size: 1.5rem"
            ></ha-icon-button>
            <ha-icon-button
              @click="${playing ? this.pause : this.play}"
              .path=${playing ? mdiPauseCircle : mdiPlayCircle}
              style="--mdc-icon-button-size: 6rem;--mdc-icon-size: 4rem"
            ></ha-icon-button>
            <ha-icon-button
              @click="${this.next}"
              .path=${mdiSkipNext}
              style="--mdc-icon-button-size: 2rem;--mdc-icon-size: 1.5rem"
            ></ha-icon-button>
            <ha-icon-button
              @click="${this.repeat}"
              .path=${this.repeatIcon()}
              style="--mdc-icon-button-size: 2rem;--mdc-icon-size: 1.5rem;margin-left:1rem"
            ></ha-icon-button>
          </div>
          <div style="flex:1;text-align: end">
            <ha-icon-button
              @click="${() => dispatchShowSection(Section.VOLUMES)}"
              ?hidden=""
              .path=${mdiTune}
              style="--mdc-icon-button-size: 2rem;--mdc-icon-size: 1.5rem;display:${this.isGroup ? 'block' : 'none'}"
            ></ha-icon-button>
          </div>
        </div>
        <dev-sonos-volume .store=${this.store} .entityId=${this.entityId} .members=${this.members}></dev-sonos-volume>
      </div>
    `;
  }

  private prev = async () => await this.mediaControlService.prev(this.entityId);
  private play = async () => await this.mediaControlService.play(this.entityId);
  private pause = async () => await this.mediaControlService.pause(this.entityId);
  private next = async () => await this.mediaControlService.next(this.entityId);
  private shuffle = async () => await this.mediaControlService.shuffle(this.entityId, !this.entity?.attributes.shuffle);
  private repeat = async () => await this.mediaControlService.repeat(this.entityId, this.entity?.attributes.repeat);

  private shuffleIcon() {
    return this.entity?.attributes.shuffle ? mdiShuffleVariant : mdiShuffleDisabled;
  }

  private repeatIcon() {
    const repeatState = this.entity?.attributes.repeat;
    return repeatState === 'all' ? mdiRepeat : repeatState === 'one' ? mdiRepeatOnce : mdiRepeatOff;
  }

  private getAdditionalSwitches() {
    if (!this.config.skipAdditionalPlayerSwitches) {
      return this.hassService.getRelatedSwitchEntities(this.entityId).then((items: string[]) => {
        return items.map((item: string) => {
          return html`
            <ha-icon-button
              @click="${() => this.hassService.toggle(item)}"
              .path=${this.hass.states[item].attributes.icon || ''}
              style="--mdc-icon-button-size: 2rem;--mdc-icon-size: 1.5rem"
            ></ha-icon-button>
          `;
        });
      });
    }
    return '';
  }

  private mainStyle() {
    return stylable('media-controls', this.config, {
      margin: '0.25rem',
      padding: '0.5rem',
      overflow: 'hidden auto',
    });
  }

  private iconsStyle() {
    return stylable('media-controls-icons', this.config, {
      justifyContent: 'space-between',
      display: 'flex',
      alignItems: 'center',
    });
  }

  static get styles() {
    return sharedStyle;
  }
}

customElements.define('dev-sonos-player-controls', PlayerControls);
