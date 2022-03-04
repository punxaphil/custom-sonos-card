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
    return html`
      <div>
        <div class="header">
          <div></div>
          <div>${this.config.mediaTitle ? this.config.mediaTitle : 'Media'}</div>
          <div
            class="browse"
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
        ${this.activePlayer !== '' &&
        until(
          (this.browse ? this.loadMediaDir(this.currentDir) : this.getAllFavorites()).then((items) => {
            const itemsWithoutImage = FavoriteButtons.itemsWithoutImage(items);
            const favoriteWidth = itemsWithoutImage
              ? getWidth(this.config, '33%', '16%', this.config.layout?.favorite)
              : '100%';
            return html` <div class="favorites ${itemsWithoutImage ? '' : 'no-thumbs'}">
              ${this.currentDir?.can_play
                ? html`
                    <sonos-favorite
                      style="width: ${favoriteWidth};max-width: ${favoriteWidth};font-weight: bold;"
                      .mediaItem="${{ title: 'Play all' }}"
                      @click="${() => this.playItem(<MediaPlayerItem>this.currentDir)}"
                    >
                    </sonos-favorite>
                  `
                : ''}
              ${items.map(
                (mediaItem) => html`
                  <sonos-favorite
                    style="width: ${favoriteWidth};max-width: ${favoriteWidth};"
                    .mediaItem="${mediaItem}"
                    @click="${() => this.onFavoriteClick(mediaItem)}"
                  />
                `,
              )}
            </div>`;
          }),
        )}
      </div>
    `;
  }

  private onFavoriteClick(mediaItem: MediaPlayerItem) {
    if (mediaItem.can_expand) {
      this.currentDir && this.parentDirs.push(this.currentDir);
      this.currentDir = mediaItem;
    } else if (mediaItem.can_play) {
      this.playItem(mediaItem);
    }
  }

  private playItem(mediaItem: MediaPlayerItem) {
    if (mediaItem.media_content_type || mediaItem.media_content_id) {
      this.mediaControlService.playMedia(this.activePlayer, mediaItem);
    } else {
      this.mediaControlService.setSource(this.activePlayer, mediaItem.title);
    }
  }

  private async getAllFavorites() {
    let allFavorites = await this.mediaBrowseService.getFavorites(this.mediaPlayers);
    if (this.config.shuffleFavorites) {
      FavoriteButtons.shuffleArray(allFavorites);
    } else {
      allFavorites = allFavorites.sort((a, b) => a.title.localeCompare(b.title, 'en', { sensitivity: 'base' }));
    }
    return allFavorites;
  }

  private static shuffleArray(array: MediaPlayerItem[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  private static itemsWithoutImage(items: MediaPlayerItem[]) {
    return items.some((item) => item.thumbnail || item.can_expand);
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
      .header {
        margin: 0.5rem 0;
        font-weight: bold;
        font-size: larger;
        color: var(--sonos-int-title-color);
        display: flex;
        justify-content: space-between;
      }
      .header div {
        flex: 1;
      }
      .favorites {
        padding: 0;
        display: flex;
        flex-wrap: wrap;
      }
      .no-thumbs {
        flex-direction: column;
      }
      .browse {
        --mdc-icon-size: 1.5rem;
        text-align: right;
        padding-right: .5rem;
        margin-left: -.5rem;
      }
      .browse:focus,
      .browse:hover {
        color: var(--sonos-int-accent-color);
      }
    `;
  }
}

customElements.define('sonos-favorite-buttons', FavoriteButtons);
