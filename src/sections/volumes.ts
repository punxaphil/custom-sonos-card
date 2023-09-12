import { css, html, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';
import Store from '../model/store';
import { CardConfig } from '../types';
import { until } from 'lit-html/directives/until.js';
import { styleMap } from 'lit-html/directives/style-map.js';
import { when } from 'lit/directives/when.js';
import { iconButton } from '../components/icon-button';
import { mdiCog, mdiCogOff, mdiVolumeMinus, mdiVolumePlus } from '@mdi/js';
import MediaControlService from '../services/media-control-service';
import { MediaPlayer } from '../model/media-player';
import { HassEntity } from 'home-assistant-js-websocket';
import HassService from '../services/hass-service';

class Volumes extends LitElement {
  @property() store!: Store;
  private config!: CardConfig;
  private activePlayer!: MediaPlayer;
  private mediaControlService!: MediaControlService;
  @state() private showSwitches: { [entity: string]: boolean } = {};
  private hassService!: HassService;

  render() {
    this.config = this.store.config;
    this.activePlayer = this.store.activePlayer;
    this.hassService = this.store.hassService;
    this.mediaControlService = this.store.mediaControlService;

    const members = this.activePlayer.members;
    return html`
      ${when(members.length, () => this.volumeWithName(this.activePlayer))}
      ${[this.activePlayer, ...members].map((member) => this.volumeWithName(member, false))}
    `;
  }

  private volumeWithName(player: MediaPlayer, updateMembers = true) {
    const name = updateMembers
      ? this.config.labelForTheAllVolumesSlider
        ? this.config.labelForTheAllVolumesSlider
        : 'All'
      : player.name;
    const volDown = async () => await this.mediaControlService.volumeDown(player, updateMembers);
    const volUp = async () => await this.mediaControlService.volumeUp(player, updateMembers);
    return html` <div class="row">
      <div class="volume-name">
        <div class="volume-name-text">${name}</div>
      </div>
      <div class="slider-row">
        ${this.config.showVolumeUpAndDownButtons ? iconButton(mdiVolumeMinus, volDown) : ''}

        <sonos-volume .store=${this.store} .player=${player} .updateMembers=${updateMembers}></sonos-volume>
        ${this.config.showVolumeUpAndDownButtons ? iconButton(mdiVolumePlus, volUp) : ''}
        ${when(!updateMembers, () =>
          iconButton(this.showSwitches[player.id] ? mdiCogOff : mdiCog, () => {
            this.showSwitches[player.id] = !this.showSwitches[player.id];
            this.requestUpdate();
          }),
        )}
      </div>
      <div class="switches">
        ${when(!player.members.length && this.showSwitches[player.id], () => until(this.getAdditionalSwitches(player)))}
      </div>
    </div>`;
  }

  private async getAdditionalSwitches(player: MediaPlayer) {
    const switches = await this.hassService.getRelatedSwitchEntities(player);
    return switches.map((switchEntity: HassEntity) => {
      const style = switchEntity.state === 'on' ? styleMap({ color: 'var(--accent-color)' }) : '';
      return html`
        <ha-icon
          @click="${() => this.hassService.toggle(switchEntity)}"
          style="${style}"
          .icon=${switchEntity.attributes.icon || ''}
        ></ha-icon>
      `;
    });
  }

  static get styles() {
    return css`
      .row {
        display: flex;
        flex-direction: column;
        padding-top: 1rem;
        padding-right: 1rem;
      }

      .row:not(:first-child) {
        border-top: solid var(--secondary-background-color);
      }

      .switches {
        display: flex;
        justify-content: center;
        gap: 1rem;
        margin-bottom: 1rem;
      }

      .volume-name {
        flex: 1;
        overflow: hidden;
        flex-direction: column;
        text-align: center;
      }

      .volume-name-text {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 1.1rem;
        font-weight: bold;
      }

      .slider-row {
        display: flex;
      }

      sonos-volume {
        flex: 4;
      }
    `;
  }
}

customElements.define('sonos-volumes', Volumes);
