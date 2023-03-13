import { HomeAssistant } from 'custom-card-helpers';
import { HassEntity } from 'home-assistant-js-websocket';
import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import Store from '../store';
import { CardConfig } from '../types';
import { getEntityName, getGroupMembers, sharedStyle, stylable } from '../utils';

class Volumes extends LitElement {
  @property() store!: Store;
  private hass!: HomeAssistant;
  private config!: CardConfig;
  private entity!: HassEntity;

  render() {
    ({ config: this.config, hass: this.hass, entity: this.entity } = this.store);

    return html`
      <div>
        ${getGroupMembers(this.entity).map(
          (entityId: string) =>
            html` <div style="display: flex">
              <div style="${this.volumeNameStyle()}">
                <div style="${this.volumeNameTextStyle()}">${getEntityName(this.hass, this.config, entityId)}</div>
              </div>
              <sonos-volume .store=${this.store} .entityId=${entityId} style=${this.volumeStyle()}></sonos-volume>
            </div>`,
        )}
      </div>
    `;
  }

  private volumeNameStyle() {
    return stylable('all-volumes-volume-name', this.config, {
      marginTop: '1rem',
      marginLeft: '0.4rem',
      flex: '1',
      overflow: 'hidden',
      flexDirection: 'column',
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
      borderBottom: 'dotted var(--sonos-int-color)',
      marginTop: '0.4rem',
    });
  }

  static get styles() {
    return sharedStyle;
  }
}

customElements.define('sonos-volumes', Volumes);
