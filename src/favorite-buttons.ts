import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import Service from './service';
import { HomeAssistant } from 'custom-card-helpers';
import { CardConfig, MediaPlayerItem } from './types';
import { getWidth } from './utils';

@customElement('sonos-favorite-buttons')
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class FavoriteButtons extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property() config!: CardConfig;
  @property() active!: string;
  @property() service!: Service;
  @property() mediaPlayers!: string[];

  @state() private favorites: MediaPlayerItem[] = [];

  render() {
    if (!this.favorites.length) {
      this.service.getFavorites(this.mediaPlayers).then((value) => {
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
                style="
                  ${favorite.thumbnail ? `background-image: url(${favorite.thumbnail});` : ''};
                "
                @click="${() => this.service.setSource(this.active, favorite.title)}"
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
        margin: 0 0 30px 0;
        display: flex;
        flex-wrap: wrap;
      }
      .favorite-wrapper {
        padding: 2px;
        box-sizing: border-box;
      }
      .favorite {
        border: 2px solid var(--sonos-int-background-color);
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
        width: 95%;
        height: 0;
        padding-bottom: 95%;
      }
      .title {
        width: 100%;
        text-align: center;
        font-size: 10px;
        position: absolute;
        top: 0;
        left: 0;
      }
      .title-with-image {
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
        background-color: var(--sonos-int-player-section-background);
      }
      .favorite:focus,
      .favorite:hover {
        border-color: var(--sonos-int-accent-color);
      }
    `;
  }
}
