import { HomeAssistant } from 'custom-card-helpers';
import { HassEntity } from 'home-assistant-js-websocket';
import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import Store from '../store';
import { CardConfig, Members } from '../types';
import { getEntityName, getGroupMembers, sharedStyle, stylable } from '../utils';

class Volumes extends LitElement {
  @property() store!: Store;
  private hass!: HomeAssistant;
  private config!: CardConfig;
  private entity!: HassEntity;

  render() {
    ({ config: this.config, hass: this.hass, entity: this.entity } = this.store);
    return html`
      <div style="margin-top: 3rem">
        ${this.volumeWithName(
          this.entity.entity_id,
          this.config.allVolumesText ? this.config.allVolumesText : 'All',
          this.store.groups[this.entity.entity_id].members,
        )}
        ${getGroupMembers(this.entity).map((entityId: string) =>
          this.volumeWithName(entityId, getEntityName(this.hass, this.config, entityId)),
        )}
      </div>
    `;
  }

  private volumeWithName(entityId: string, name: string, members?: Members) {
    return html` <div style="${this.wrapperStyle()}">
      <div style="${this.volumeNameStyle()}">
        <div style="${this.volumeNameTextStyle()}">${name}</div>
      </div>
      <dev-sonos-volume
        .store=${this.store}
        .entityId=${entityId}
        style=${this.volumeStyle()}
        showGrouping=${false}
        .members=${members}
      ></dev-sonos-volume>
    </div>`;
  }

  private wrapperStyle() {
    const border = 'solid var(--secondary-background-color)';
    return stylable('all-volumes-wrapper', this.config, {
      display: 'flex',
      flexDirection: 'column',
      borderTop: border,
      paddingTop: '1rem',
    });
  }

  private volumeNameStyle() {
    return stylable('all-volumes-volume-name', this.config, {
      flex: '1',
      overflow: 'hidden',
      flexDirection: 'column',
      textAlign: 'center',
    });
  }

  private volumeNameTextStyle() {
    return stylable('all-volumes-volume-name-text', this.config, {
      flex: '1',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    });
  }

  private volumeStyle() {
    return stylable('player-volume', this.config, {
      flex: '4',
    });
  }

  static get styles() {
    return sharedStyle;
  }
}

customElements.define('dev-sonos-volumes', Volumes);
