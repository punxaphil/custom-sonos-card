import { css, html, LitElement, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import Store from '../../model/store';
import { until } from 'lit-html/directives/until.js';
import { mdiCog, mdiVolumeMinus, mdiVolumePlus } from '@mdi/js';
import { MediaPlayer } from '../../model/media-player';
import { HassEntity } from 'home-assistant-js-websocket';
import './sleep-timer';

export class Volumes extends LitElement {
  @property({ attribute: false }) store!: Store;
  @state() private showSwitches: { [entity: string]: boolean } = {};

  render() {
    const members = this.store.activePlayer.members;
    const showAll = members.length > 1;
    return html`
      <div ?hidden=${!showAll}>${showAll ? this.volumeWithName(this.store.activePlayer) : nothing}</div>
      ${members.map((member) => this.volumeWithName(member, false))}
    `;
  }

  private volumeWithName(player: MediaPlayer, updateMembers = true) {
    const { labelForAllSlider, hideCogwheel } = this.store.config.volumes ?? {};
    const { showVolumeUpAndDownButtons } = this.store.config.player ?? {};
    const name = updateMembers ? (labelForAllSlider ?? 'All') : player.name;
    const volDown = async () => await this.store.mediaControlService.volumeDown(player, updateMembers);
    const volUp = async () => await this.store.mediaControlService.volumeUp(player, updateMembers);
    const hideSwitches = updateMembers || !this.showSwitches[player.id];
    return html` <div class="row">
      <div class="volume-name">
        <div class="volume-name-text">${name}</div>
      </div>
      <div class="slider-row">
        <ha-icon-button .disabled=${player.ignoreVolume} ?hidden=${!showVolumeUpAndDownButtons} @click=${volDown} .path=${mdiVolumeMinus}></ha-icon-button>
        <sonos-volume .store=${this.store} .player=${player} .updateMembers=${updateMembers}></sonos-volume>
        <ha-icon-button .disabled=${player.ignoreVolume} ?hidden=${!showVolumeUpAndDownButtons} @click=${volUp} .path=${mdiVolumePlus}></ha-icon-button>
        <ha-icon-button
          ?hidden=${updateMembers || !!hideCogwheel}
          @click=${() => this.toggleShowSwitches(player)}
          .path=${mdiCog}
          show-switches=${this.showSwitches[player.id] || nothing}
        ></ha-icon-button>
      </div>
      <div class="switches" ?hidden=${hideSwitches}>
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
      return [];
    }
    const relatedEntities = await this.store.hassService.getRelatedEntities(player, 'switch', 'number', 'sensor');
    const { additionalControlsFontSize: fontSize = 0.75 } = this.store.config.volumes ?? {};
    return relatedEntities.map((relatedEntity: HassEntity) => {
      relatedEntity.attributes.friendly_name = relatedEntity.attributes.friendly_name?.replaceAll(player.name, '')?.trim() ?? '';
      return html`
        <div style="--ha-font-size-m: ${fontSize}rem">
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
        font-size: calc(var(--sonos-font-size, 1rem) * 1.1);
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

      [hidden] {
        display: none !important;
      }
    `;
  }
}
