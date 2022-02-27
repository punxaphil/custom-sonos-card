import { css, html, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';
import MediaBrowseService from '../services/media-browse-service';
import { HomeAssistant } from 'custom-card-helpers';
import { CardConfig, MediaPlayerItem } from '../types';
import { getWidth } from '../utils';
import MediaControlService from '../services/media-control-service';

class FavoriteButtons extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property() config!: CardConfig;
  @property() active!: string;
  @property() mediaBrowseService!: MediaBrowseService;
  @property() mediaControlService!: MediaControlService;
  @property() mediaPlayers!: string[];

  @state() private favorites: MediaPlayerItem[] = [];

  render() {
    if (!this.favorites.length) {
      this.mediaBrowseService.getFavorites(this.mediaPlayers).then((value) => {
        if (this.config.shuffleFavorites) {
          this.shuffleArray(value);
        } else {
          value = value.sort((a, b) => a.title.localeCompare(b.title, 'en', { sensitivity: 'base' }));
        }
        this.favorites = value;
      });
    }
    const favoriteWidth = getWidth(this.config, '33%', '16%', this.config.layout?.favorite);
    return html`
      <div class="favorites">
        ${this.active !== '' &&
        this.favorites.map(
          (favorite) => html`
            <div class="favorite-wrapper" style="width: ${favoriteWidth};max-width: ${favoriteWidth};">
              <div
                class="favorite ${favorite.thumbnail ? 'image' : ''}"
                style="${favorite.thumbnail ? `background-image: url(${favorite.thumbnail});` : ''};"
                @click="${() => this.mediaControlService.setSource(this.active, favorite.title)}"
              >
                <div class="title ${favorite.thumbnail ? 'title-with-image' : ''}">${favorite.title}</div>
              </div>
            </div>
          `,
        )}
      </div>
    `;
  }

  shuffleArray(array: MediaPlayerItem[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  static get styles() {
    return css`
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
        text-align: center;
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
    `;
  }
}

customElements.define('sonos-favorite-buttons', FavoriteButtons);
