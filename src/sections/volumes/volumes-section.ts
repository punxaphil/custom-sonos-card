import { css, html, LitElement, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import Store from '../../model/store';
import { until } from 'lit-html/directives/until.js';
import { mdiCog, mdiVolumeMinus, mdiVolumePlus } from '@mdi/js';
import { MediaPlayer } from '../../model/media-player';
import { HassEntity } from 'home-assistant-js-websocket';
import { getSpeakerList } from '../../utils/utils';
import './sleep-timer';
import '../../components/icon-button';

export class Volumes extends LitElement {
  @property({ attribute: false }) store!: Store;
  @state() private showSwitches: { [entity: string]: boolean } = {};

  render() {
    const members = this.store.activePlayer.members;
    const showAll = members.length > 1;
    const hideActivePlayerName = this.store.config.volumes?.hideActivePlayerName ?? false;
    const playerName = showAll && !hideActivePlayerName ? getSpeakerList(this.store.activePlayer, this.store.predefinedGroups) : '';
    return html`
      <div ?hidden=${!showAll}>${showAll ? this.volumeWithName(this.store.activePlayer, true, playerName) : nothing}</div>
      ${members.map((member) => this.volumeWithName(member, false))}
    `;
  }

  private volumeWithName(player: MediaPlayer, updateMembers = true, groupName: string = '') {
    const { labelForAllSlider, hideCogwheel } = this.store.config.volumes ?? {};
    const { showVolumeUpAndDownButtons } = this.store.config.player ?? {};
    const name = updateMembers ? (labelForAllSlider ?? 'All') : player.name;
    const volDown = async () => await this.store.mediaControlService.volumeDown(player, updateMembers);
    const volUp = async () => await this.store.mediaControlService.volumeUp(player, updateMembers);
    const hideSwitches = updateMembers || !this.showSwitches[player.id];
    const sliderHeight = this.store.config.volumeSliderHeight;
    const buttonStyle = sliderHeight ? `height: ${sliderHeight}rem;--icon-button-size: ${sliderHeight}rem;--icon-size: ${sliderHeight * 0.75}rem;` : '';
    return html` <div class="row">
      <div class="volume-name">
        ${updateMembers && groupName
          ? html`
              <div class="volume-name-text grouped-name">
                <span class="grouped-name-prefix">${name} (</span>
                <span class="grouped-name-main">${groupName}</span>
                <span class="grouped-name-suffix">)</span>
              </div>
            `
          : html`<div class="volume-name-text">${name}</div>`}
      </div>
      <div class="slider-row">
        <sonos-icon-button
          .disabled=${player.ignoreVolume}
          ?hidden=${!showVolumeUpAndDownButtons}
          @click=${volDown}
          .path=${mdiVolumeMinus}
          style=${buttonStyle}
        ></sonos-icon-button>
        <sonos-volume .store=${this.store} .player=${player} .updateMembers=${updateMembers}></sonos-volume>
        <sonos-icon-button
          .disabled=${player.ignoreVolume}
          ?hidden=${!showVolumeUpAndDownButtons}
          @click=${volUp}
          .path=${mdiVolumePlus}
          style=${buttonStyle}
        ></sonos-icon-button>
        <sonos-icon-button
          ?hidden=${updateMembers || !!hideCogwheel}
          @click=${() => this.toggleShowSwitches(player)}
          .path=${mdiCog}
          show-switches=${this.showSwitches[player.id] || nothing}
          style=${buttonStyle}
        ></sonos-icon-button>
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
        padding-inline: 0.5rem;
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
        max-width: 90%;
        align-self: center;
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

      .grouped-name {
        display: flex;
        align-items: center;
      }

      .grouped-name-main {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .grouped-name-prefix,
      .grouped-name-suffix {
        flex-shrink: 0;
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

      sonos-icon-button {
        height: 40px;
        align-self: start;
      }
    `;
  }
}
