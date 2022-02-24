import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import Service from './service';
import './player';
import './group';
import './grouping-buttons';
import './favorite-buttons';
import { createPlayerGroups, getMediaPlayers, getWidth, isMobile } from './utils';
import { HomeAssistant } from 'custom-card-helpers';
import { CardConfig, PlayerGroups, Size } from './types';
import { styleMap, StyleInfo } from 'lit-html/directives/style-map.js';

// This puts your card into the UI card picker dialog
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'custom-sonos-card',
  name: 'Sonos Card',
  description: 'Customized media player for your Sonos speakers',
  preview: true,
});

@customElement('custom-sonos-card')
export class CustomSonosCard extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property() config!: CardConfig;
  @state() private active!: string;
  @state() showVolumes!: boolean;
  private service!: Service;

  render() {
    this.service = new Service(this.hass);
    const mediaPlayers = getMediaPlayers(this.config, this.hass);
    const playerGroups = createPlayerGroups(mediaPlayers, this.hass, this.config);
    this.determineActivePlayer(playerGroups);
    window.onresize = () => setTimeout(() => this.render(), 1000);
    return html`
      ${this.config.name
        ? html`
            <div class="header">
              <div class="name">${this.config.name}</div>
            </div>
          `
        : ''}
      <div class="content" style="flex-direction: ${isMobile(this.config) ? 'column' : 'row'}">
        <div style=${this.groupsStyle()} class="groups">
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

        <div style=${this.playersStyle()} class="players">
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

        <div style=${this.sidebarStyle()} class="sidebar">
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

  private groupsStyle() {
    return this.columnStyle(this.config.layout?.groups, '1', '25%');
  }

  private playersStyle() {
    return this.columnStyle(this.config.layout?.players, '0', '45%');
  }

  private sidebarStyle() {
    return this.columnStyle(this.config.layout?.favorites, '2', '25%');
  }

  private columnStyle(size: Size | undefined, order: string, defaultWidth: string) {
    const width = getWidth(this.config, defaultWidth, '100%', size);
    let style: StyleInfo = {
      width: width,
      maxWidth: width,
    };
    if (isMobile(this.config)) {
      style = {
        ...style,
        order,
        padding: '0.5rem',
        margin: '0',
        boxSizing: 'border-box',
      };
    }
    return styleMap(style);
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

  setConfig(config: CardConfig) {
    this.config = config;
  }

  getCardSize() {
    return 3;
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
        --sonos-int-border-radius: 0.25rem;
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
      .content {
        display: flex;
        flex-wrap: nowrap;
        justify-content: center;
      }
      .groups {
        margin: 0 20px 0 20px;
        padding: 0;
      }
      .sidebar {
        margin: 0 20px 0 20px;
        padding: 0;
      }
      .title {
        margin-top: 10px;
        text-align: center;
        font-weight: bold;
        font-size: larger;
        color: var(--sonos-int-title-color);
      }
    `;
  }

  setActivePlayer(player: string) {
    this.active = player;
    const newUrl = window.location.href.replaceAll(/#.*/g, '');
    window.location.href = `${newUrl}#${player}`;
  }
}
