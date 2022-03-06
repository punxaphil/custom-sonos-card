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
        this.mediaPlayers
          .filter((entity) => entity !== this.activePlayer)
          .map((entity) => {
            if (this.groups[this.activePlayer].members[entity]) {
              return html`
                <div class="member" @click="${() => this.mediaControlService.unjoin(entity)}">
                  <span>${this.groups[this.activePlayer].members[entity]} </span>
                  <ha-icon .icon=${'mdi:minus'}></ha-icon>
                </div>
              `;
            } else {
              return html`
                <div class="member" @click="${() => this.mediaControlService.join(this.activePlayer, entity)}">
                  <span>${getEntityName(this.hass, this.config, entity)} </span>
                  <ha-icon .icon=${'mdi:plus'}></ha-icon>
                </div>
              `;
            }
          })}
        ${notJoinedPlayers.length
          ? html`
              <div
                class="member"
                @click="${() => this.mediaControlService.join(this.activePlayer, notJoinedPlayers.join(','))}"
              >
                <ha-icon .icon=${'mdi:checkbox-multiple-marked-outline'}></ha-icon>
              </div>
            `
          : ''}
        ${joinedPlayers.length
          ? html`
              <div class="member" @click="${() => this.mediaControlService.unjoin(joinedPlayers.join(','))}">
                <ha-icon .icon=${'mdi:minus-box-multiple-outline'}></ha-icon>
              </div>
            `
          : ''}
      </div>
    `;
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
        background-color: var(--sonos-int-background-color);
        box-shadow: var(--sonos-int-box-shadow);
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
      .member:hover ha-icon {
        color: var(--sonos-int-accent-color);
      }
    `;
  }
}

customElements.define('sonos-grouping-buttons', GroupingButtons);
