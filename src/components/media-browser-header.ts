import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { MediaPlayerItem } from '../types';
import MediaControlService from '../services/media-control-service';
import { titleStyle } from '../sharedStyle';
import { CustomSonosCard } from '../main';
import './media-button';
import { MediaBrowser } from './media-browser';

class MediaBrowserHeader extends LitElement {
  @property() main!: CustomSonosCard;
  @property() mediaBrowser!: MediaBrowser;
  @property() browse!: boolean;
  @property() currentDir!: MediaPlayerItem;
  private activePlayer!: string;
  private mediaControlService!: MediaControlService;

  render() {
    this.activePlayer = this.main.activePlayer;
    this.mediaControlService = this.main.mediaControlService;
    return html`
      <div style="${this.headerStyle()}" class="hoverable">
        <div style="${this.playDirStyle()}" class="hoverable">
          ${this.currentDir?.can_play
            ? html` <ha-icon
                .icon=${'mdi:play'}
                @click="${() => this.mediaBrowser.playItem(<MediaPlayerItem>this.currentDir)}"
              ></ha-icon>`
            : ''}
        </div>
        <div style="${this.titleStyle()}">${this.main.config.mediaTitle ? this.main.config.mediaTitle : 'Media'}</div>
        <div style="${this.browseStyle()}" @click="${() => this.mediaBrowser.browseClicked()}">
          <ha-icon .icon=${this.browse ? 'mdi:arrow-left-bold' : 'mdi:play-box-multiple'}></ha-icon>
        </div>
      </div>
    `;
  }

  private headerStyle() {
    return this.main.stylable('media-browser-header', {
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
    return this.main.stylable('title', this.headerChildStyle);
  }

  private playDirStyle() {
    return this.main.stylable('media-browser-play-dir', {
      textAlign: 'left',
      paddingRight: '-0.5rem',
      marginLeft: '0.5rem',
      ...this.headerChildStyle,
    });
  }
  private browseStyle() {
    return this.main.stylable('media-browse', {
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
    `;
  }
}

customElements.define('sonos-media-browser-header', MediaBrowserHeader);
