import { html } from 'lit';
import { MediaItem } from './media-item';
import { stylable } from '../utils';

class MediaListItem extends MediaItem {
  private iconStyle = {
    position: 'relative',
    flexShrink: '0',
    width: '30px',
    height: '30px',
  };

  render() {
    const thumbnail = this.getThumbnail();
    return html`
      <div style="${this.wrapperStyle()}" class="hoverable">
        <div style="${this.listItemStyle()}">
          <div style="${this.thumbnailStyle(thumbnail)}"></div>
          <ha-icon style="${this.folderStyle(thumbnail)}" .icon=${'mdi:folder-music'}></ha-icon>
          <div style="${this.titleStyle(thumbnail)}">${this.mediaItem.title}</div>
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
    return stylable('media-button-thumb', this.config, {
      ...this.iconStyle,
      backgroundSize: '30px',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'left',
      backgroundImage: 'url(' + thumbnail + ')',
      ...(!thumbnail && { display: 'none' }),
    });
  }

  private folderStyle(thumbnail: string) {
    return stylable('media-button-folder', this.config, {
      ...this.iconStyle,
      '--mdc-icon-size': '90%',
      ...((!this.mediaItem.can_expand || thumbnail) && { display: 'none' }),
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

customElements.define('dev-sonos-media-list-item', MediaListItem);
