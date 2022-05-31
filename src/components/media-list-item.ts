import { html } from 'lit';
import { MediaItem } from './media-item';

class MediaListItem extends MediaItem {
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
      }),
    });
  }
}

customElements.define('sonos-media-list-item', MediaListItem);
