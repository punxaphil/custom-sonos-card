import { css, html, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';
import './components/player';
import './components/groups';
import './components/grouping';
import './components/media-browser';
import { createPlayerGroups, getMediaPlayers, getWidth, isMobile } from './utils';
import { HomeAssistant } from 'custom-card-helpers';
import { CardConfig, PlayerGroups, Size } from './types';
import { StyleInfo, styleMap } from 'lit-html/directives/style-map.js';
import MediaBrowseService from './services/media-browse-service';
import MediaControlService from './services/media-control-service';
import HassService from './services/hass-service';
import { titleStyle } from './sharedStyle';

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
  @state() activePlayer!: string;
  @state() showVolumes!: boolean;
  mediaBrowseService!: MediaBrowseService;
  mediaControlService!: MediaControlService;

  render() {
    if (!this.mediaBrowseService) {
      const hassService = new HassService(this.hass);
      this.mediaBrowseService = new MediaBrowseService(this.hass, hassService);
      this.mediaControlService = new MediaControlService(this.hass, hassService);
    }
    const mediaPlayers = getMediaPlayers(this.config, this.hass);
    const playerGroups = createPlayerGroups(mediaPlayers, this.hass, this.config);
    this.determineActivePlayer(playerGroups);
    return html`
      <ha-card style="${this.haCardStyle()}">
        <div style="${this.titleStyle()}">${this.config.name}</div>
        <div style="${this.contentStyle()}">
          <div style=${this.groupsStyle()}>
            <sonos-groups .main="${this}" .groups="${playerGroups}" .activePlayer="${this.activePlayer}" />
          </div>

          <div style=${this.playersStyle()}>
            <sonos-player .main=${this} .members=${playerGroups[this.activePlayer].members}></sonos-player>
            <sonos-grouping .main=${this} .groups=${playerGroups} .mediaPlayers=${mediaPlayers}></sonos-grouping>
          </div>

          <div style=${this.mediaBrowserStyle()}>
            <sonos-media-browser .main=${this} .mediaPlayers=${mediaPlayers}></sonos-media-browser>
          </div>
        </div>
      </ha-card>
    `;
  }

  stylable(configName: string, additionalStyle?: StyleInfo) {
    return styleMap({
      ...{
        '--sonos-card-style-name': configName,
      },
      ...additionalStyle,
      ...this.config?.styles?.[configName],
    });
  }

  private titleStyle() {
    return this.stylable('title', { display: this.config.name ? 'block' : 'none', ...titleStyle });
  }

  private groupsStyle() {
    return this.columnStyle(this.config.layout?.groups, '1', '25%', 'groups', {
      padding: '0 1rem',
      boxSizing: 'border-box',
    });
  }

  private playersStyle() {
    return this.columnStyle(this.config.layout?.players, '0', '40%', 'players');
  }

  private mediaBrowserStyle() {
    return this.columnStyle(this.config.layout?.mediaBrowser, '2', '25%', 'media-browser', {
      padding: '0 1rem',
      boxSizing: 'border-box',
    });
  }

  private columnStyle(
    size: Size | undefined,
    order: string,
    defaultWidth: string,
    name: string,
    additionalStyle?: StyleInfo,
  ) {
    const width = getWidth(this.config, defaultWidth, '100%', size);
    let style: StyleInfo = {
      width: width,
      maxWidth: width,
      ...additionalStyle,
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
    return this.stylable(name, style);
  }

  private haCardStyle() {
    return this.stylable('ha-card', {
      color: 'var(--sonos-int-color)',
      background: 'var(--sonos-int-ha-card-background-color)',
    });
  }

  private contentStyle() {
    return this.stylable('content', {
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'center',
    });
  }

  determineActivePlayer(playerGroups: PlayerGroups) {
    const selected_player =
      this.config.selectedPlayer ||
      (window.location.href.indexOf('#') > 0 ? window.location.href.replace(/.*#/g, '') : '');
    if (this.activePlayer) {
      this.setActivePlayer(this.activePlayer);
    }
    if (!this.activePlayer) {
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
    if (!this.activePlayer) {
      for (const player in playerGroups) {
        if (playerGroups[player].state === 'playing') {
          this.setActivePlayer(player);
        }
      }
    }
    if (!this.activePlayer) {
      this.setActivePlayer(Object.keys(playerGroups)[0]);
    }
  }

  setActivePlayer(player: string) {
    this.activePlayer = player;
    const newUrl = window.location.href.replace(/#.*/g, '');
    window.location.href = `${newUrl}#${player}`;
  }

  setConfig(config: CardConfig) {
    this.config = JSON.parse(JSON.stringify(config));
    // Handle deprecated configs
    const deprecatedMessage = (deprecated: string, instead: string) =>
      console.log('Sonos Card: ' + deprecated + ' configuration is deprecated. Please use ' + instead + ' instead.');
    if (this.config.layout && !this.config.layout?.mediaBrowser && this.config.layout.favorites) {
      deprecatedMessage('layout.favorites', 'layout.mediaBrowser');
      this.config.layout.mediaBrowser = this.config.layout.favorites;
    }
    if (this.config.layout && !this.config.layout?.mediaItem && this.config.layout.favorite) {
      deprecatedMessage('layout.favorite', 'layout.mediaItem');
      this.config.layout.mediaItem = this.config.layout.favorite;
    }
  }

  getCardSize() {
    return 3;
  }

  static get styles() {
    return css`
      :host {
        --sonos-int-background-color: var(
          --sonos-background-color,
          var(--ha-card-background, var(--card-background-color, white))
        );
        --sonos-int-ha-card-background-color: var(
          --sonos-ha-card-background-color,
          var(--ha-card-background, var(--card-background-color, white))
        );
        --sonos-int-player-section-background: var(--sonos-player-section-background, #ffffffe6);
        --sonos-int-color: var(--sonos-color, var(--secondary-text-color));
        --sonos-int-artist-album-text-color: var(--sonos-artist-album-text-color, var(--secondary-text-color));
        --sonos-int-song-text-color: var(--sonos-song-text-color, var(--sonos-accent-color, var(--accent-color)));
        --sonos-int-accent-color: var(--sonos-accent-color, var(--accent-color));
        --sonos-int-title-color: var(--sonos-title-color, var(--secondary-text-color));
        --sonos-int-border-radius: var(--sonos-border-radius, 0.25rem);
        --sonos-int-border-width: var(--sonos-border-width, 0.125rem);
        --sonos-int-media-button-white-space: var(
          --sonos-media-buttons-multiline,
          var(--sonos-favorites-multiline, nowrap)
        );
        --sonos-int-button-section-background-color: var(
          --sonos-button-section-background-color,
          var(--card-background-color)
        );
        --mdc-icon-size: 1rem;
      }
    `;
  }
}

customElements.define('custom-sonos-card', CustomSonosCard);
