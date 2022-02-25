import { css, html, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';
import Service from './service';
import './player';
import './group';
import './grouping-buttons';
import './favorite-buttons';
import { getEntityName } from './utils';
import { HomeAssistant } from 'custom-card-helpers';
import { CardConfig, PlayerGroups } from './types';

// This puts your card into the UI card picker dialog
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'custom-sonos-card',
  name: 'Sonos Card',
  description: 'Customized media player for your Sonos speakers',
  preview: true,
});

export class CustomSonosCard extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property() config!: CardConfig;
  @state() private active!: string;
  @state() showVolumes!: boolean;
  private service!: Service;

  render() {
    this.service = new Service(this.hass);
    const mediaPlayers = this.getMediaPlayers();
    const playerGroups = this.createPlayerGroups(mediaPlayers);
    this.determineActivePlayer(playerGroups);
    return html`
      ${this.config.name
        ? html`
            <div class="header">
              <div class="name">${this.config.name}</div>
            </div>
          `
        : ''}
      <div class="content">
        <div class="groups">
          <div class="title">${this.config.groupsTitle ? this.config.groupsTitle : 'Groups'}</div>
          ${Object.keys(playerGroups).map(
            (group) => html`
              <sonos-group
                .hass=${this.hass}
                .group=${group}
                .config=${this.config}
                .active=${this.active === group}
                @click="${() => {
                  this.setActivePlayer(group);
                  this.showVolumes = false;
                }}"
              >
              </sonos-group>
            `,
          )}
        </div>

        <div class="players">
          <sonos-player
            .hass=${this.hass}
            .config=${this.config}
            .entityId=${this.active}
            .main=${this}
            .members=${playerGroups[this.active].members}
            .service=${this.service}
          >
          </sonos-player>
          <div class="title">${this.config.groupingTitle ? this.config.groupingTitle : 'Grouping'}</div>
          <sonos-grouping-buttons
            .hass=${this.hass}
            .config=${this.config}
            .groups=${playerGroups}
            .mediaPlayers=${mediaPlayers}
            .active=${this.active}
            .service=${this.service}
          >
          </sonos-grouping-buttons>
        </div>

        <div class="sidebar">
          <div class="title">${this.config.favoritesTitle ? this.config.favoritesTitle : 'Favorites'}</div>
          <sonos-favorite-buttons
            .hass=${this.hass}
            .config=${this.config}
            .mediaPlayers=${mediaPlayers}
            .active=${this.active}
            .service=${this.service}
          >
          </sonos-favorite-buttons>
        </div>
      </div>
    `;
  }

  private getMediaPlayers() {
    if (this.config.entities) {
      return [...new Set(this.config.entities)].sort().filter((player) => this.hass.states[player]);
    } else {
      return Object.values(this.hass.states)
        .filter((state) => state.attributes.sonos_group)
        .map((state) => state.entity_id)
        .sort();
    }
  }

  determineActivePlayer(playerGroups: PlayerGroups) {
    const selected_player = window.location.href.indexOf('#') > 0 ? window.location.href.replaceAll(/.*#/g, '') : '';
    if (this.active) {
      this.setActivePlayer(this.active);
    }
    if (!this.active) {
      for (const player in playerGroups) {
        if (player === selected_player) {
          this.setActivePlayer(player);
        } else {
          for (const member in playerGroups[player].members) {
            if (member === selected_player) {
              this.setActivePlayer(player);
            }
          }
        }
      }
    }
    if (!this.active) {
      for (const player in playerGroups) {
        if (playerGroups[player].state === 'playing') {
          this.setActivePlayer(player);
        }
      }
    }
    if (!this.active) {
      this.setActivePlayer(Object.keys(playerGroups)[0]);
    }
  }

  createPlayerGroups(mediaPlayers: string[]): PlayerGroups {
    const groupMasters = mediaPlayers.filter((player) => {
      const state = this.hass.states[player];
      try {
        const stateAttributes = state.attributes;
        const sonosGroup = stateAttributes.sonos_group.filter((member: string) => mediaPlayers.indexOf(member) > -1);
        const isGrouped = sonosGroup?.length > 1;
        const isMasterInGroup = isGrouped && sonosGroup && sonosGroup[0] === player;
        return !isGrouped || isMasterInGroup;
      } catch (e) {
        console.error('Failed to determine group master', JSON.stringify(state), e);
        return false;
      }
    });
    const groupArray = groupMasters.map((groupMaster) => {
      const state = this.hass.states[groupMaster];
      try {
        const membersArray = state.attributes.sonos_group.filter((member: string) => {
          return member !== groupMaster && mediaPlayers.indexOf(member) > -1;
        });
        return {
          entity: groupMaster,
          state: state.state,
          roomName: getEntityName(this.hass, this.config, groupMaster),
          members: Object.fromEntries(
            membersArray.map((member: string) => {
              const friendlyName = getEntityName(this.hass, this.config, member);
              return [member, friendlyName];
            }),
          ),
        };
      } catch (e) {
        console.error('Failed to create group', JSON.stringify(state), e);
        return {};
      }
    });
    return Object.fromEntries(groupArray.map((group) => [group.entity, group]));
  }

  setConfig(config: CardConfig) {
    this.config = config;
  }

  getCardSize() {
    return this.config.entities.length + 1;
  }

  static get styles() {
    return css`
      :host {
        --sonos-int-box-shadow: var(
          --ha-card-box-shadow,
          0px 2px 1px -1px rgba(0, 0, 0, 0.2),
          0px 1px 1px 0px rgba(0, 0, 0, 0.14),
          0px 1px 3px 0px rgba(0, 0, 0, 0.12)
        );
        --sonos-int-background-color: var(--sonos-background-color, var(--card-background-color));
        --sonos-int-player-section-background: var(--sonos-player-section-background, #ffffffe6);
        --sonos-int-color: var(--sonos-color, var(--secondary-text-color));
        --sonos-int-artist-album-text-color: var(--sonos-artist-album-text-color, var(--primary-text-color));
        --sonos-int-accent-color: var(--sonos-accent-color, var(--accent-color));
        --sonos-int-title-color: var(--sonos-title-color, var(--card-background-color));
        --sonos-int-border-radius: var(--sonos-border-radius, 0.25rem);
        --sonos-int-border-width: var(--sonos-border-width, 8px);
        --mdc-icon-size: 18px;
        color: var(--sonos-int-color);
      }
      .header {
        font-size: 24px;
        letter-spacing: -0.012em;
        line-height: 32px;
        padding: 4px 0 12px;
        display: block;
      }
      .header .name {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .players {
        flex: 0 0 45%;
        max-width: 700px;
      }
      .content {
        display: flex;
        flex-direction: row;
        flex-wrap: nowrap;
        justify-content: center;
      }
      .groups {
        margin: 0 20px 0 20px;
        padding: 0;
        flex: 0 0 25%;
        max-width: 25%;
      }
      .sidebar {
        margin: 0 20px 0 20px;
        padding: 0;
        flex: 0 0 25%;
        max-width: 25%;
      }
      .title {
        margin: 10px 0;
        text-align: center;
        font-weight: bold;
        font-size: larger;
        color: var(--sonos-int-title-color);
      }
      @media (max-width: 650px) {
        .content {
          flex-direction: column;
        }
        .players {
          order: 0;
        }
        .groups {
          order: 1;
        }
        .sidebar {
          order: 2;
        }
        .content div {
          max-width: 100%;
          margin: 5px;
        }
      }
    `;
  }

  setActivePlayer(player: string) {
    this.active = player;
    const newUrl = window.location.href.replaceAll(/#.*/g, '');
    window.location.href = `${newUrl}#${player}`;
  }
}

customElements.define('custom-sonos-card', CustomSonosCard);
