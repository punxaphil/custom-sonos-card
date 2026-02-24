import { css, html, LitElement, PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import Store from '../../model/store';
import { mdiHeart, mdiHeartOutline } from '@mdi/js';

class PlayerFavoriteButton extends LitElement {
  @property({ attribute: false }) store!: Store;
  @state() private isFavorite: boolean | null = null;
  @state() private favoriteLoading = false;
  private lastMediaContentId: string | undefined;

  protected willUpdate(changedProperties: PropertyValues): void {
    if (changedProperties.has('store')) {
      const isMusicAssistant = this.store.hassService.musicAssistantService.isMusicAssistantPlayer(this.store.activePlayer);
      const currentMediaContentId = this.store.activePlayer.attributes.media_content_id;
      if (isMusicAssistant && currentMediaContentId !== this.lastMediaContentId) {
        this.lastMediaContentId = currentMediaContentId;
        this.isFavorite = null;
        this.favoriteLoading = false;
        this.refreshFavoriteStatus();
      }
    }
  }

  render() {
    const isMusicAssistant = this.store.hassService.musicAssistantService.isMusicAssistantPlayer(this.store.activePlayer);
    const favoriteClass = `favorite-button ${this.isFavorite ? 'is-favorite' : ''} ${this.favoriteLoading ? 'loading' : ''}`;
    const favoriteTitle = this.isFavorite ? 'Remove from favorites' : 'Add to favorites';
    return html`
      <ha-icon-button
        class=${favoriteClass}
        ?hidden=${!isMusicAssistant}
        @click=${this.toggleFavorite}
        .path=${this.isFavorite ? mdiHeart : mdiHeartOutline}
        title=${favoriteTitle}
        ?disabled=${this.favoriteLoading}
      ></ha-icon-button>
    `;
  }

  private async refreshFavoriteStatus() {
    const songIdAtStart = this.store.activePlayer.attributes.media_content_id;
    const favorite = await this.store.hassService.musicAssistantService.getCurrentSongFavorite(this.store.activePlayer);
    if (this.store.activePlayer.attributes.media_content_id === songIdAtStart) {
      this.isFavorite = favorite;
    }
  }

  private toggleFavorite = async () => {
    if (this.favoriteLoading) {
      return;
    }
    const songIdAtStart = this.store.activePlayer.attributes.media_content_id;
    this.favoriteLoading = true;
    try {
      if (this.isFavorite) {
        const success = await this.store.hassService.musicAssistantService.unfavoriteCurrentSong(this.store.activePlayer);
        if (success && this.store.activePlayer.attributes.media_content_id === songIdAtStart) {
          this.isFavorite = false;
        }
      } else {
        const success = await this.store.hassService.musicAssistantService.favoriteCurrentSong(this.store.activePlayer);
        if (success && this.store.activePlayer.attributes.media_content_id === songIdAtStart) {
          this.isFavorite = true;
        }
      }
    } finally {
      this.favoriteLoading = false;
    }
  };

  static get styles() {
    return css`
      [hidden] {
        display: none !important;
      }
      .favorite-button.is-favorite {
        color: var(--accent-color);
      }
      .favorite-button.loading {
        opacity: 0.5;
      }
    `;
  }
}

customElements.define('sonos-player-favorite-button', PlayerFavoriteButton);
