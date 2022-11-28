import { html } from 'lit';
import { MediaItem } from './media-item';
import { stylable } from '../utils';

class MediaListItem extends MediaItem {
  render() {
    const thumbnail = this.getThumbnail();
    return html`
      <div style="${this.wrapperStyle()}">
        <div style="${this.listItemStyle()}">
          <div style="${this.thumbnailStyle(thumbnail)}" class="hoverable"></div>
          <div style="${this.titleStyle(thumbnail)}">${this.mediaItem.title}</div>
          <ha-icon style="${this.folderStyle(thumbnail)}" .icon=${'mdi:folder-music'}></ha-icon>
        </div>
      </div>
    `;
  }

  private listItemStyle() {
    return stylable('media-button', this.config, {
      ...this.mediaButtonStyle(),
      flexDirection: 'row',
      justifyContent: 'left',
      alignItems: 'center',
      height: '30px',
    });
  }

  private thumbnailStyle(thumbnail: string) {
    return stylable('media-button', this.config, {
      ...((thumbnail || this.mediaItem.can_expand) && {
        width: '30px',
        height: '30px',
        backgroundSize: '30px',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'left',
        position: 'relative',
        flexShrink: '0',
      }),
      ...(thumbnail && { backgroundImage: 'url(' + thumbnail + ')' }),
    });
  }

  private titleStyle(thumbnail: string) {
    return stylable('media-button-title', this.config, {
      fontSize: '0.9rem',
      padding: '0px 0.5rem',
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      flex: '1',
      ...((thumbnail || this.mediaItem.can_expand) && {
        zIndex: '1',
      }),
    });
  }
}

customElements.define('sonos-media-list-item', MediaListItem);
