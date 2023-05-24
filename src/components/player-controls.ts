import { HomeAssistant } from 'custom-card-helpers';
import { HassEntity } from 'home-assistant-js-websocket';
import { html, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';
import HassService from '../services/hass-service';
import MediaControlService from '../services/media-control-service';
import Store from '../store';
import { CardConfig, Members } from '../types';
import { getGroupMembers, isPlaying } from '../utils';
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
} from '@mdi/js';
import { iconButton } from './icon-button';
import { styleMap } from 'lit-html/directives/style-map.js';

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
      hassService: this.hassService,
      mediaControlService: this.mediaControlService,
    } = this.store);
    this.members = this.store.groups[this.entityId].members;
    this.isGroup = getGroupMembers(this.entity).length > 1;
    const playing = isPlaying(this.entity.state);

    // ${until(this.getAdditionalSwitches())}

    return html`
      <div style="${this.mainStyle()}" id="mediaControls">
        <div style="${this.iconsStyle()}">
          ${iconButton(this.shuffleIcon(), this.shuffle, { additionalStyle: { marginRight: '1rem' } })}
          ${iconButton(mdiSkipPrevious, this.prev, undefined)}
          ${iconButton(playing ? mdiPauseCircle : mdiPlayCircle, playing ? this.pause : this.play, { big: true })}
          ${iconButton(mdiSkipNext, this.next, undefined)}
          ${iconButton(this.repeatIcon(), this.repeat, { additionalStyle: { marginLeft: '1rem' } })}
        </div>
        <sonos-volume .store=${this.store} .entityId=${this.entityId} .members=${this.members}></sonos-volume>
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

  private mainStyle() {
    return styleMap({
      margin: '0.25rem',
      padding: '0.5rem',
      overflow: 'hidden auto',
    });
  }

  private iconsStyle() {
    return styleMap({
      justifyContent: 'center',
      display: 'flex',
      alignItems: 'center',
    });
  }
}

customElements.define('sonos-player-controls', PlayerControls);
