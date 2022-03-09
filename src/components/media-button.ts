import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { MediaPlayerItem } from '../types';

class MediaButton extends LitElement {
  @property() mediaItem!: MediaPlayerItem;

  render() {
    return html`
      <div class="media-button-wrapper">
        <div
          class="media-button ${this.mediaItem.thumbnail || this.mediaItem.can_expand ? 'image' : ''}"
          style="${this.getThumbnail()};"
        >
          <div class="title ${this.mediaItem.thumbnail || this.mediaItem.can_expand ? 'title-with-image' : ''}">
            ${this.mediaItem.title}
          </div>
          ${this.mediaItem.can_expand && !this.mediaItem.thumbnail
            ? html` <ha-icon class="folder" .icon=${'mdi:folder-music'}></ha-icon>`
            : ''}
        </div>
      </div>
    `;
  }

  private getThumbnail() {
    let thumbnail = this.mediaItem.thumbnail;
    thumbnail = thumbnail?.match(/https:\/\/brands.home-assistant.io\/.+\/logo.png/)
      ? thumbnail?.replace('logo.png', 'icon.png')
      : thumbnail;
    return thumbnail ? `background-image: url(${thumbnail});` : '';
  }

  static get styles() {
    return css`
      .media-button-wrapper {
        padding: 0 0.3rem 0.6rem 0.3rem;
      }
      .media-button {
        box-sizing: border-box;
        -moz-box-sizing: border-box;
        -webkit-box-sizing: border-box;
        overflow: hidden;
        border: var(--sonos-int-border-width) solid var(--sonos-int-background-color);
        display: flex;
        flex-direction: column;
        border-radius: var(--sonos-int-border-radius);
        justify-content: center;
        background-color: var(--sonos-int-background-color);
        box-shadow: var(--sonos-int-box-shadow);
      }
      .image {
        background-size: contain;
        position: relative;
        padding-bottom: calc(100% - (var(--sonos-int-border-width) * 2));
      }
      .title {
        width: calc(100% - 1rem);
        font-size: 1rem;
        padding: 0px 0.5rem;
      }
      .title-with-image {
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: var(--sonos-int-media-button-white-space);
        background-color: var(--sonos-int-player-section-background);
        position: absolute;
        top: 0rem;
        left: 0rem;
      }
      .media-button:focus,
      .media-button:hover {
        border-color: var(--sonos-int-accent-color);
      }
      .folder {
        margin-bottom: -30%;
        height: 100%;
        --mdc-icon-size: 1;
      }
    `;
  }
}

customElements.define('sonos-media-button', MediaButton);
