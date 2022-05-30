import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { CardConfig, MediaPlayerItem } from '../types';
import { CustomSonosCard } from '../main';

class MediaButton extends LitElement {
  @property() mediaItem!: MediaPlayerItem;
  @property() config!: CardConfig;
  @property() main!: CustomSonosCard;

  render() {
    const thumbnail = this.getThumbnail();
    return html`
      <div style="${this.wrapperStyle()}">
        <div style="${this.mediaButtonStyle()}">
          <div style="${this.thumbnailStyle(thumbnail)}" class="hoverable"></div>
          <div style="${this.titleStyle(thumbnail)}">${this.mediaItem.title}</div>
          <ha-icon style="${this.folderStyle(thumbnail)}" .icon=${'mdi:folder-music'}></ha-icon>
        </div>
      </div>
    `;
  }

  private getThumbnail() {
    let thumbnail = this.mediaItem.thumbnail;
    if (!thumbnail) {
      thumbnail = this.config.customThumbnailIfMissing?.[this.mediaItem.title] || '';
    } else if (thumbnail?.match(/https:\/\/brands.home-assistant.io\/.+\/logo.png/)) {
      thumbnail = thumbnail?.replace('logo.png', 'icon.png');
    }
    return thumbnail;
  }
  private wrapperStyle() {
    return this.main.stylable('media-button-wrapper', {
      padding: '0 0.3rem 0.6rem 0.3rem',
    });
  }
  private mediaButtonStyle() {
    return this.main.stylable('media-button', {
      boxSizing: 'border-box',
      '-moz-box-sizing': 'border-box',
      '-webkit-box-sizing': 'border-box',
      overflow: 'hidden',
      border: 'var(--sonos-int-border-width) solid var(--sonos-int-color)',
      display: 'flex',
      flexDirection: 'row',
      borderRadius: 'var(--sonos-int-border-radius)',
      justifyContent: 'left',
      alignItems: 'center',
      backgroundColor: 'var(--sonos-int-background-color)',
      height: '50px',
      // paddingBottom: 'calc(30% - (var(--sonos-int-border-width) * 2))',
    });
  }
  private thumbnailStyle(thumbnail: string) {
    return this.main.stylable('media-button', {
      ...((thumbnail || this.mediaItem.can_expand) && {
        width: '50px',
        height: '50px',
        backgroundSize: '50px',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'left',
        position: 'relative',
        flexShrink: '0',
      }),
      ...(thumbnail && { backgroundImage: 'url(' + thumbnail + ')' }),
    });
  }
  private titleStyle(thumbnail: string) {
    return this.main.stylable('media-button-title', {
      // width: 'calc(100% - 1rem)',
      fontSize: '1rem',
      padding: '0px 0.5rem',
      flex: '1',
      ...((thumbnail || this.mediaItem.can_expand) && {
        zIndex: '1',
        textOverflow: 'ellipsis',
        overflowWrap: 'break-word',
        // whiteSpace: 'var(--sonos-int-media-button-white-space)',
        overflow: 'hidden',
        '-webkit-line-clamp': '2',
        display: '-webkit-box',
        '-webkit-box-orient': 'vertical',

        // marginLeft: '30%',
        // backgroundColor: 'var(--sonos-int-player-section-background)',
        // position: 'absolute',
        // top: '0rem',
        // left: '0rem',
      }),
    });
  }

  private folderStyle(thumbnail: string) {
    return this.main.stylable('media-button-folder', {
      marginBottom: '-120%',
      '--mdc-icon-size': '1',
      ...((!this.mediaItem.can_expand || thumbnail) && { display: 'none' }),
    });
  }

  static get styles() {
    return css`
      .hoverable:focus,
      .hoverable:hover {
        border-color: var(--sonos-int-accent-color);
        color: var(--sonos-int-accent-color);
      }
    `;
  }
}

customElements.define('sonos-media-button', MediaButton);
