import { HomeAssistant } from 'custom-card-helpers';
import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import '../components/group';
import Store from '../store';
import { CardConfig, PlayerGroups } from '../types';
import { listStyle } from '../utils';
import sharedStyle from '../sharedStyle';

export class Groups extends LitElement {
  @property() store!: Store;
  private hass!: HomeAssistant;
  private config!: CardConfig;
  private groups!: PlayerGroups;
  private entityId!: string;

  render() {
    ({ config: this.config, hass: this.hass, groups: this.groups, entityId: this.entityId } = this.store);
    return html`
      <mwc-list activatable style="${listStyle(this.config)}">
        ${Object.values(this.groups).map((group) => {
          const selected = this.entityId === group.entity;
          return html`
            <dev-sonos-group .store=${this.store} .group=${group} .selected="${selected}"></dev-sonos-group>
          `;
        })}
      </mwc-list>
    `;
  }

  static get styles() {
    return sharedStyle;
  }
}
