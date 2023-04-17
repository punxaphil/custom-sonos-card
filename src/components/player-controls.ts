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
import { iconButton } from './icon-button';

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
            ${iconButton(this.shuffleIcon(), this.shuffle, this.config, { additionalStyle: { marginRight: '1rem' } })}
            ${iconButton(mdiSkipPrevious, this.prev, this.config)}
            ${iconButton(playing ? mdiPauseCircle : mdiPlayCircle, playing ? this.pause : this.play, this.config, {
              big: true,
            })}
            ${iconButton(mdiSkipNext, this.next, this.config)}
            ${iconButton(this.repeatIcon(), this.repeat, this.config, { additionalStyle: { marginLeft: '1rem' } })}
          </div>
          <div style="flex:1;text-align: end">
            ${iconButton(mdiTune, () => dispatchShowSection(Section.VOLUMES), this.config, {
              additionalStyle: { display: this.isGroup ? 'block' : 'none' },
            })}
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
      return this.hassService
        .getRelatedSwitchEntities(this.entityId)
        .then((items: string[]) =>
          items.map((item: string) =>
            iconButton(this.hass.states[item].attributes.icon || '', () => this.hassService.toggle(item), this.config),
          ),
        );
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
