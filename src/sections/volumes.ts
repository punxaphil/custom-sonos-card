import { HomeAssistant } from 'custom-card-helpers';
import { HassEntity } from 'home-assistant-js-websocket';
import { css, html, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';
import Store from '../store';
import { CardConfig, Members } from '../types';
import { getEntityName, getGroupMembers } from '../utils';
import { until } from 'lit-html/directives/until.js';
import { styleMap } from 'lit-html/directives/style-map.js';
import { when } from 'lit/directives/when.js';
import { iconButton } from '../components/icon-button';
import { mdiCog, mdiCogOff, mdiVolumeMinus, mdiVolumePlus } from '@mdi/js';
import MediaControlService from '../services/media-control-service';

class Volumes extends LitElement {
  @property() store!: Store;
  private hass!: HomeAssistant;
  private config!: CardConfig;
  private entity!: HassEntity;
  private mediaControlService!: MediaControlService;
  @state() private showSwitches: { [entity: string]: boolean } = {};

  render() {
    ({
      config: this.config,
      hass: this.hass,
      mediaControlService: this.mediaControlService,

      entity: this.entity,
    } = this.store);
    const members = getGroupMembers(this.entity);
    return html`
      ${when(members.length > 1, () =>
        this.volumeWithName(
          this.entity.entity_id,
          this.config.labelForTheAllVolumesSlider ? this.config.labelForTheAllVolumesSlider : 'All',
          this.store.groups[this.entity.entity_id].members,
        ),
      )}
      ${members.map((entityId: string) =>
        this.volumeWithName(entityId, getEntityName(this.hass, this.config, entityId)),
      )}
    `;
  }

  private volumeWithName(entityId: string, name: string, members?: Members) {
    const volDown = async () => await this.mediaControlService.volumeDown(entityId);
    const volUp = async () => await this.mediaControlService.volumeUp(entityId);
    return html` <div class="row">
      <div class="volume-name">
        <div class="volume-name-text">${name}</div>
      </div>
      <div class="slider-row">
        ${this.config.showVolumeUpAndDownButtons ? iconButton(mdiVolumeMinus, volDown) : ''}

        <sonos-volume .store=${this.store} .entityId=${entityId} .members=${members}></sonos-volume>
        ${this.config.showVolumeUpAndDownButtons ? iconButton(mdiVolumePlus, volUp) : ''}
        ${when(!members, () =>
          iconButton(this.showSwitches[entityId] ? mdiCogOff : mdiCog, () => {
            this.showSwitches[entityId] = !this.showSwitches[entityId];
            this.requestUpdate();
          }),
        )}
      </div>
      <div class="switches">
        ${when(!members && this.showSwitches[entityId], () => until(this.getAdditionalSwitches(entityId)))}
      </div>
    </div>`;
  }

  private getAdditionalSwitches(entityId: string) {
    const hassService = this.store.hassService;
    return hassService.getRelatedSwitchEntities(entityId).then((items: string[]) =>
      items.map((item: string) => {
        const style = this.hass.states[item].state === 'on' ? styleMap({ color: 'var(--accent-color)' }) : '';
        return html`
          <ha-icon
            @click="${() => hassService.toggle(item)}"
            style="${style}"
            .icon=${this.hass.states[item].attributes.icon || ''}
          ></ha-icon>
        `;
      }),
    );
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
