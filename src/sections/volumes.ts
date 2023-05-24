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
import { mdiCog, mdiCogOff } from '@mdi/js';

class Volumes extends LitElement {
  @property() store!: Store;
  private hass!: HomeAssistant;
  private config!: CardConfig;
  private entity!: HassEntity;
  @state() private showSwitches: { [entity: string]: boolean } = {};

  render() {
    ({ config: this.config, hass: this.hass, entity: this.entity } = this.store);
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
    const switchesStyle = styleMap({
      display: 'flex',
      justifyContent: 'center',
      gap: '1rem',
      marginBottom: '1rem',
    });
    return html` <div class="wrapper">
      <div style="${this.volumeNameStyle()}">
        <div style="${this.volumeNameTextStyle()}">${name}</div>
      </div>
      <div style="display:flex">
        <dev-sonos-volume
          .store=${this.store}
          .entityId=${entityId}
          style=${this.volumeStyle()}
          .members=${members}
        ></dev-sonos-volume>
        ${when(!members, () =>
          iconButton(this.showSwitches[entityId] ? mdiCogOff : mdiCog, () => {
            this.showSwitches[entityId] = !this.showSwitches[entityId];
            this.requestUpdate();
          }),
        )}
      </div>
      <div style="${switchesStyle}">
        ${when(!members && this.showSwitches[entityId], () => until(this.getAdditionalSwitches(entityId)))}
      </div>
    </div>`;
  }

  private volumeNameStyle() {
    return styleMap({
      flex: '1',
      overflow: 'hidden',
      flexDirection: 'column',
      textAlign: 'center',
    });
  }

  private volumeNameTextStyle() {
    return styleMap({
      flex: '1',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    });
  }

  private volumeStyle() {
    return styleMap({
      flex: '4',
    });
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
    return [
      css`
        .wrapper {
          display: flex;
          flex-direction: column;
          padding-top: 1rem;
          padding-right: 1rem;
        }
        .wrapper:not(:first-child) {
          border-top: solid var(--secondary-background-color);
        }
      `,
    ];
  }
}

customElements.define('dev-sonos-volumes', Volumes);
