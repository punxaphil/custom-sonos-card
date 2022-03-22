import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { PlayerGroups } from '../types';
import { getEntityName } from '../utils';
import { CustomSonosCard } from '../main';

class GroupingButtons extends LitElement {
  @property() main!: CustomSonosCard;
  @property() groups!: PlayerGroups;
  @property() mediaPlayers!: string[];

  render() {
    const activePlayer = this.main.activePlayer;
    const mediaControlService = this.main.mediaControlService;
    const joinedPlayers = this.mediaPlayers.filter(
      (player) => player !== activePlayer && this.groups[activePlayer].members[player],
    );
    const notJoinedPlayers = this.mediaPlayers.filter(
      (player) => player !== activePlayer && !this.groups[activePlayer].members[player],
    );
    const stylable = this.main.stylable;

    return html`
      <div class="members" style="${stylable('members')}">
        ${activePlayer &&
        this.mediaPlayers.map((entity) => {
          if (this.groups[activePlayer].members[entity] || (entity === activePlayer && joinedPlayers.length > 0)) {
            return html`
              <div class="member" @click="${() => mediaControlService.unjoin(entity)}" style="${stylable('member')}">
                <span>${getEntityName(this.main.hass, this.main.config, entity)} </span>
                <ha-icon .icon=${'mdi:minus'}></ha-icon>
              </div>
            `;
          } else if (entity !== activePlayer) {
            return html`
              <div
                class="member"
                @click="${() => mediaControlService.join(activePlayer, entity)}"
                style="${stylable('member')}"
              >
                <span>${getEntityName(this.main.hass, this.main.config, entity)} </span>
                <ha-icon .icon=${'mdi:plus'}></ha-icon>
              </div>
            `;
          } else {
            return html``;
          }
        })}
        ${notJoinedPlayers.length
          ? html`
              <div
                class="member"
                @click="${() => mediaControlService.join(activePlayer, notJoinedPlayers.join(','))}"
                style="${stylable('member')}"
              >
                <ha-icon .icon=${'mdi:checkbox-multiple-marked-outline'}></ha-icon>
              </div>
            `
          : ''}
        ${joinedPlayers.length
          ? html`
              <div
                class="member"
                @click="${() => mediaControlService.unjoin(joinedPlayers.join(','))}"
                style="${stylable('member')}"
              >
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
