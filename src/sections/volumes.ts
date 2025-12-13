import { css, html, LitElement, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import Store from '../model/store';
import { CardConfig } from '../types';
import { until } from 'lit-html/directives/until.js';
import { when } from 'lit/directives/when.js';
import { mdiCog, mdiVolumeMinus, mdiVolumePlus } from '@mdi/js';
import MediaControlService from '../services/media-control-service';
import { MediaPlayer } from '../model/media-player';
import HassService from '../services/hass-service';
import { HassEntity } from 'home-assistant-js-websocket';
import '../components/sleep-timer';

export class Volumes extends LitElement {
  @property({ attribute: false }) store!: Store;
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
      ${when(members.length > 1, () => this.volumeWithName(this.activePlayer))}
      ${members.map((member) => this.volumeWithName(member, false))}
    `;
  }

  private volumeWithName(player: MediaPlayer, updateMembers = true) {
    const name = updateMembers ? (this.config.volumesLabelForAllSlider ?? 'All') : player.name;
    const volDown = async () => await this.mediaControlService.volumeDown(player, updateMembers);
    const volUp = async () => await this.mediaControlService.volumeUp(player, updateMembers);
    const noUpDown = !!this.config.playerShowVolumeUpAndDownButtons && nothing;
    const hideSwitches = updateMembers || !this.showSwitches[player.id];
    return html` <div class="row">
      <div class="volume-name">
        <div class="volume-name-text">${name}</div>
      </div>
      <div class="slider-row">
        <ha-icon-button
          .disabled=${player.ignoreVolume}
          hide=${noUpDown}
          @click=${volDown}
          .path=${mdiVolumeMinus}
        ></ha-icon-button>
        <sonos-volume .store=${this.store} .player=${player} .updateMembers=${updateMembers}></sonos-volume>
        <ha-icon-button
          .disabled=${player.ignoreVolume}
          hide=${noUpDown}
          @click=${volUp}
          .path=${mdiVolumePlus}
        ></ha-icon-button>
        <ha-icon-button
          hide=${updateMembers || this.config.volumesHideCogwheel || nothing}
          @click=${() => this.toggleShowSwitches(player)}
          .path=${mdiCog}
          show-switches=${this.showSwitches[player.id] || nothing}
        ></ha-icon-button>
      </div>
      <div class="switches" hide=${hideSwitches || nothing}>
        <sonos-source .store=${this.store}> </sonos-source>
        ${until(this.getAdditionalControls(hideSwitches, player))}
        <sonos-sleep-timer .store=${this.store} .player=${player}></sonos-sleep-timer>
      </div>
    </div>`;
  }

  private toggleShowSwitches(player: MediaPlayer) {
    this.showSwitches[player.id] = !this.showSwitches[player.id];
    this.requestUpdate();
  }

  private async getAdditionalControls(hide: boolean, player: MediaPlayer) {
    if (hide) {
      return;
    }
    const relatedEntities = await this.hassService.getRelatedEntities(player, 'switch', 'number', 'sensor');
    return relatedEntities.map((relatedEntity: HassEntity) => {
      relatedEntity.attributes.friendly_name =
        relatedEntity.attributes.friendly_name?.replaceAll(player.name, '')?.trim() ?? '';
      return html`
        <div>
          <state-card-content .stateObj=${relatedEntity} .hass=${this.store.hass}></state-card-content>
        </div>
      `;
    });
  }

  static get styles() {
    return css`
      .row {
        display: flex;
        flex-direction: column;
        padding-top: 0.3rem;
        padding-right: 1rem;
        padding-bottom: 0.2rem;
      }

      .row:not(:first-child) {
        border-top: solid var(--secondary-background-color);
      }

      .row:first-child {
        padding-top: 1rem;
      }

      .switches {
        display: flex;
        justify-content: center;
        flex-direction: column;
        gap: 1rem;
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
        min-height: 1rem;
      }

      .slider-row {
        display: flex;
      }

      sonos-volume {
        flex: 4;
      }

      *[show-switches] {
        color: var(--accent-color);
      }

      *[hide] {
        display: none;
      }

      state-card-content {
        --ha-font-size-m: 12px;
      }
    `;
  }
}
