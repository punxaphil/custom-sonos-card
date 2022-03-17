import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { HomeAssistant } from 'custom-card-helpers';
import { CardConfig, PlayerGroups } from '../types';
import MediaControlService from '../services/media-control-service';
import { getEntityName } from '../utils';

class GroupingButtons extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property() config!: CardConfig;
  @property() activePlayer!: string;
  @property() mediaControlService!: MediaControlService;
  @property() groups!: PlayerGroups;
  @property() mediaPlayers!: string[];

  render() {
    const joinedPlayers = this.mediaPlayers.filter(
      (player) => player !== this.activePlayer && this.groups[this.activePlayer].members[player],
    );
    const notJoinedPlayers = this.mediaPlayers.filter(
      (player) => player !== this.activePlayer && !this.groups[this.activePlayer].members[player],
    );

    return html`
      <div class="members">
        ${this.activePlayer &&
        this.mediaPlayers.map((entity) => {
          if (
            this.groups[this.activePlayer].members[entity] ||
            (entity === this.activePlayer && joinedPlayers.length > 0)
          ) {
            return html`
              <div class="member" @click="${this.unjoin(entity)}">
                <span>${getEntityName(this.hass, this.config, entity)} </span>
                <ha-icon .icon=${'mdi:minus'}></ha-icon>
              </div>
            `;
          } else if (entity !== this.activePlayer) {
            return html`
              <div class="member" @click="${this.join(entity)}">
                <span>${getEntityName(this.hass, this.config, entity)} </span>
                <ha-icon .icon=${'mdi:plus'}></ha-icon>
              </div>
            `;
          } else {
            return html``;
          }
        })}
        ${notJoinedPlayers.length
          ? html`
              <div class="member" @click="${this.join(...notJoinedPlayers)}">
                <ha-icon .icon=${'mdi:checkbox-multiple-marked-outline'}></ha-icon>
              </div>
            `
          : ''}
        ${joinedPlayers.length
          ? html`
              <div class="member" @click="${this.unjoin(...joinedPlayers)}">
                <ha-icon .icon=${'mdi:minus-box-multiple-outline'}></ha-icon>
              </div>
            `
          : ''}
      </div>
    `;
  }

  private join(...entities: string[]) {
    return () => this.mediaControlService.join(this.activePlayer, ...entities);
  }

  private unjoin(...entities: string[]) {
    return () => this.mediaControlService.unjoin(...entities);
  }

  static get styles() {
    return css`
      .members {
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: space-between;
      }
      .member {
        flex-grow: 1;
        border-radius: var(--sonos-int-border-radius);
        margin: 0 0.25rem 0.5rem;
        padding: 0.45rem;
        display: flex;
        justify-content: center;
        border: var(--sonos-int-border-width) solid var(--sonos-int-color);
        background-color: var(--sonos-int-background-color);
        max-width: calc(100% - 1.4rem);
      }
      .member span {
        align-self: center;
        font-size: 1rem;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .member ha-icon {
        align-self: center;
        font-size: 0.5rem;
      }
      .member:hover,
      .member:focus {
        color: var(--sonos-int-accent-color);
        border: var(--sonos-int-border-width) solid var(--sonos-int-accent-color);
      }
    `;
  }
}

customElements.define('sonos-grouping-buttons', GroupingButtons);
