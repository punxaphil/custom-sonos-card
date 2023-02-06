import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { CardConfig, MediaPlayerItem } from '../types';
import { titleStyle } from '../sharedStyle';
import { HomeAssistant } from 'custom-card-helpers';
import { stylable } from '../utils';
import { MediaBrowser } from '../cards/media-browser';

class MediaBrowserHeader extends LitElement {
  @property() hass!: HomeAssistant;
  @property() config!: CardConfig;

  @property() mediaBrowser!: MediaBrowser;
  @property() browse!: boolean;
  @property() currentDir!: MediaPlayerItem;

  render() {
    return html`
      <div style="${this.headerStyle()}" class="hoverable">
        <div style="${this.playDirStyle()}" class="hoverable">
          ${this.currentDir?.can_play
            ? html` <ha-icon
                .icon=${'mdi:play'}
                @click="${async () => await this.mediaBrowser.playItem(<MediaPlayerItem>this.currentDir)}"
              ></ha-icon>`
            : ''}
        </div>
        <div style="${this.titleStyle()}">${this.config.mediaTitle ? this.config.mediaTitle : 'Media'}</div>
        <div style="${this.browseStyle()}" @click="${() => this.mediaBrowser.browseClicked()}">
          <ha-icon .icon=${this.browse ? 'mdi:arrow-left-bold' : 'mdi:play-box-multiple'}></ha-icon>
        </div>
      </div>
    `;
  }

  private headerStyle() {
    return stylable('media-browser-header', this.config, {
      display: 'flex',
      justifyContent: 'space-between',
      ...titleStyle,
    });
  }

  private headerChildStyle = {
    flex: '1',
    '--mdc-icon-size': '1.5rem',
  };

  private titleStyle() {
    return stylable('title', this.config, this.headerChildStyle);
  }

  private playDirStyle() {
    return stylable('media-browser-play-dir', this.config, {
      textAlign: 'left',
      paddingRight: '-0.5rem',
      marginLeft: '0.5rem',
      ...this.headerChildStyle,
    });
  }

  private browseStyle() {
    return stylable('media-browse', this.config, {
      textAlign: 'right',
      paddingRight: '0.5rem',
      marginLeft: '-0.5rem',
      ...this.headerChildStyle,
    });
  }

  static get styles() {
    return css`
      .hoverable:focus,
      .hoverable:hover {
        color: var(--sonos-int-accent-color);
      }
      .hoverable:active {
        color: var(--primary-color);
      }
    `;
  }
}

customElements.define('sonos-media-browser-header', MediaBrowserHeader);
