import { css, html, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';
import MediaBrowseService from '../services/media-browse-service';
import { HomeAssistant } from 'custom-card-helpers';
import { CardConfig, MediaPlayerItem } from '../types';
import { getWidth } from '../utils';
import MediaControlService from '../services/media-control-service';
import { until } from 'lit-html/directives/until.js';

class FavoriteButtons extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property() config!: CardConfig;
  @property() activePlayer!: string;
  @property() mediaBrowseService!: MediaBrowseService;
  @property() mediaControlService!: MediaControlService;
  @property() mediaPlayers!: string[];
  @state() private browse!: boolean;
  @state() private currentDir?: MediaPlayerItem;

  @state() private mediaItems: MediaPlayerItem[] = [];
  private parentDirs: MediaPlayerItem[] = [];

  render() {
    const favoriteWidth = getWidth(this.config, '33%', '16%', this.config.layout?.favorite);
    return html`
      <div>
        <div class="header">
          <div></div>
          <div>${this.config.mediaTitle ? this.config.mediaTitle : 'Media'}</div>
          <div
            @click="${() => {
              if (this.parentDirs.length) {
                this.currentDir = this.parentDirs.pop();
              } else if (this.currentDir) {
                this.currentDir = undefined;
              } else {
                this.browse = !this.browse;
              }
            }}"
          >
            ${this.browse
              ? html` <ha-icon .icon=${'mdi:keyboard-backspace'}></ha-icon>`
              : html` <ha-icon .icon=${'mdi:play-box-multiple'}></ha-icon> `}
          </div>
        </div>
        <div class="favorites">
          ${this.activePlayer !== '' &&
          until(
            (this.browse ? this.loadMediaDir(this.currentDir) : this.getAllFavorites()).then((items) =>
              items.map(
                (mediaItem) => html`
                  <div class="favorite-wrapper" style="width: ${favoriteWidth};max-width: ${favoriteWidth};">
                    <div
                      class="favorite ${mediaItem.thumbnail || mediaItem.can_expand ? 'image' : ''}"
                      style="${mediaItem.thumbnail ? `background-image: url(${mediaItem.thumbnail});` : ''};"
                      @click="${() => {
                        if (mediaItem.can_expand) {
                          this.currentDir && this.parentDirs.push(this.currentDir);
                          this.currentDir = mediaItem;
                        } else if (mediaItem.can_play) {
                          this.mediaControlService.setSource(this.activePlayer, mediaItem.title);
                        }
                      }}"
                    >
                      <div class="title ${mediaItem.thumbnail || mediaItem.can_expand ? 'title-with-image' : ''}">
                        ${mediaItem.title}
                      </div>
                      ${mediaItem.can_expand && !mediaItem.thumbnail
                        ? html`<ha-icon class="folder" .icon=${'mdi:folder-music'}></ha-icon>`
                        : ''}
                    </div>
                  </div>
                `,
              ),
            ),
          )}
        </div>
      </div>
    `;
  }

  private async getAllFavorites() {
    let allFavorites = await this.mediaBrowseService.getFavorites(this.mediaPlayers);
    if (this.config.shuffleFavorites) {
      this.shuffleArray(allFavorites);
    } else {
      allFavorites = allFavorites.sort((a, b) => a.title.localeCompare(b.title, 'en', { sensitivity: 'base' }));
    }
    return allFavorites;
  }

  shuffleArray(array: MediaPlayerItem[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  private async loadMediaDir(mediaItem?: MediaPlayerItem) {
    return await (mediaItem
      ? this.mediaBrowseService.getDir(this.activePlayer, mediaItem)
      : this.mediaBrowseService.getRoot(this.activePlayer));
  }

  static get styles() {
    return css`
      :host {
        text-align: center;
      }
      .favorites {
        padding: 0;
        display: flex;
        flex-wrap: wrap;
      }
      .favorite-wrapper {
        padding: 0 0.6rem 0.4rem 0;
        box-sizing: border-box;
      }
      .favorite {
        overflow: hidden;
        border: 0.1rem solid var(--sonos-int-background-color);
        display: flex;
        flex-direction: column;
        border-radius: var(--sonos-int-border-radius);
        justify-content: center;
        background-color: var(--sonos-int-background-color);
        box-shadow: var(--sonos-int-box-shadow);
      }
      .image {
        background-position-x: center;
        background-repeat: no-repeat;
        background-size: cover;
        position: relative;
        width: 100%;
        height: 0;
        padding-bottom: 100%;
      }
      .title {
        width: calc(100% - 0.2rem);
        font-size: 0.6rem;
      }
      .title-with-image {
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: var(--sonos-int-favorites-white-space);
        background-color: var(--sonos-int-player-section-background);
        border-radius: calc(var(--sonos-int-border-radius) - 0.25rem) calc(var(--sonos-int-border-radius) - 0.25rem) 0 0;
        position: absolute;
        top: 0.1rem;
        left: 0.1rem;
      }
      .favorite:focus,
      .favorite:hover {
        border-color: var(--sonos-int-accent-color);
      }
      .header {
        margin: 0.5rem 0;
        font-weight: bold;
        font-size: larger;
        color: var(--sonos-int-title-color);
        display: flex;
        justify-content: space-between;
      }
      .folder {
        margin-bottom: -30%;
        height: 100%;
        --mdc-icon-size: 1;
      }
    `;
  }
}

customElements.define('sonos-favorite-buttons', FavoriteButtons);
