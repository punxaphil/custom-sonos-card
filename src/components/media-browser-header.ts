import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { MediaBrowser } from '../cards/media-browser';
import { titleStyle } from '../sharedStyle';
import { CardConfig, MediaPlayerItem } from '../types';
import { stylable } from '../utils';

class MediaBrowserHeader extends LitElement {
  @property() config!: CardConfig;
  @property() mediaBrowser!: MediaBrowser;
  @property() browse!: boolean;
  @property() currentDir!: MediaPlayerItem;

  render() {
    return html`
      <div style="${this.headerStyle()}" class="hoverable">
        <div style="flex:1"></div>
        <div style="${this.titleStyle()}">
          ${this.config.mediaTitle ? this.config.mediaTitle : html`<ha-icon .icon=${'mdi:star-outline'}></ha-icon>`}
        </div>
        <div style="${this.browseStyle()}">
          ${this.currentDir?.can_play
            ? html` <ha-icon
                style="padding-right: 1rem"
                .icon=${'mdi:play'}
                @click="${async () => await this.mediaBrowser.playItem(<MediaPlayerItem>this.currentDir)}"
              ></ha-icon>`
            : ''}
          <ha-icon
            style="padding-right: 0.4rem"
            .icon=${this.browse ? 'mdi:arrow-up-left-bold' : 'mdi:play-box-multiple'}
            @click="${() => this.mediaBrowser.browseClicked()}"
          ></ha-icon>
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

customElements.define('dev-sonos-media-browser-header', MediaBrowserHeader);
