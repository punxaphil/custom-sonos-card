import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { CardConfig, MediaPlayerItem } from '../types';
import { HomeAssistant } from 'custom-card-helpers';
import { stylable } from '../utils';
import { MediaItem } from './media-item';

class MediaIconItem extends MediaItem {
  @property() mediaItem!: MediaPlayerItem;
  @property() hass!: HomeAssistant;
  @property() config!: CardConfig;

  render() {
    const thumbnail = this.getThumbnail();
    return html`
      <div style="${this.wrapperStyle()}">
        <div style="${this.iconItemStyle(thumbnail)}" class="hoverable">
          <div style="${this.titleStyle(thumbnail)}">${this.mediaItem.title}</div>
          <ha-icon style="${this.folderStyle(thumbnail)}" .icon=${'mdi:folder-music'}></ha-icon>
        </div>
      </div>
    `;
  }

  private iconItemStyle(thumbnail: string) {
    return stylable('media-button', this.config, {
      ...this.mediaButtonStyle(),
      flexDirection: 'column',
      borderRadius: 'var(--sonos-int-border-radius)',
      justifyContent: 'center',
      backgroundColor: 'var(--sonos-int-background-color)',
      ...((thumbnail || this.mediaItem.can_expand) && {
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        position: 'relative',
        paddingBottom: 'calc(100% - (var(--sonos-int-border-width) * 2))',
      }),
      ...(thumbnail && { backgroundImage: 'url(' + thumbnail + ')' }),
    });
  }

  private titleStyle(thumbnail: string) {
    return stylable('media-button-title', this.config, {
      width: 'calc(100% - 1rem)',
      fontSize: '1rem',
      padding: '0px 0.5rem',
      ...((thumbnail || this.mediaItem.can_expand) && {
        zIndex: '1',
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        whiteSpace: 'var(--sonos-int-media-button-white-space)',
        backgroundColor: 'var(--sonos-int-player-section-background)',
        position: 'absolute',
        top: '0rem',
        left: '0rem',
      }),
    });
  }
}

customElements.define('sonos-media-icon-item', MediaIconItem);
