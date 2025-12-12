import { css, html, LitElement, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import '../components/player-controls';
import '../components/player-header';
import '../components/progress';
import '../components/volume';

import Store from '../model/store';
import { CardConfig } from '../types';

import { MUSIC_NOTES_BASE64_IMAGE, TV_BASE64_IMAGE } from '../constants';
import { MediaPlayer } from '../model/media-player';

export class Player extends LitElement {
  @property({ attribute: false }) store!: Store;
  @state() private resolvedImageUrl?: string;
  private config!: CardConfig;
  private activePlayer!: MediaPlayer;
  private lastTemplateUrl?: string;

  render() {
    this.config = this.store.config;
    this.activePlayer = this.store.activePlayer;

    this.resolveTemplateImageUrlIfNeeded();
    const blurAmount = this.config.artworkAsBackgroundBlur ?? 0;
    const artworkAsBackground = this.config.artworkAsBackground || blurAmount > 0;
    const backgroundOpacity = this.config.playerControlsAndHeaderBackgroundOpacity ?? 0.9;
    const backgroundOverlayColor = this.config.playerBackgroundOverlayColor;
    const containerStyle = artworkAsBackground
      ? blurAmount > 0
        ? `--blur-background-image: ${this.getBackgroundImageUrl()}; --blur-amount: ${blurAmount}px; --background-opacity: ${backgroundOpacity}${backgroundOverlayColor ? `; --background-overlay-color: ${backgroundOverlayColor}` : ''}`
        : `${this.getBackgroundImage()}; --background-opacity: ${backgroundOpacity}${backgroundOverlayColor ? `; --background-overlay-color: ${backgroundOverlayColor}` : ''}`
      : '';
    return html`
      <div class="container ${blurAmount > 0 ? 'blurred-background' : ''}" style=${containerStyle || nothing}>
        <sonos-player-header
          class="header"
          background=${artworkAsBackground || nothing}
          .store=${this.store}
          hide=${this.config.playerHideHeader || nothing}
        ></sonos-player-header>
        <div
          class="artwork"
          hide=${(artworkAsBackground && !blurAmount) || this.config.hidePlayerArtwork || nothing}
          style=${this.artworkStyle()}
        ></div>
        <sonos-player-controls
          class="controls"
          background=${artworkAsBackground || nothing}
          .store=${this.store}
          hide=${this.config.playerHideControls || nothing}
        ></sonos-player-controls>
      </div>
    `;
  }

  private artworkStyle() {
    const minHeight = this.config.artworkMinHeight ?? 5;
    return `${this.getBackgroundImage()}; min-height: ${minHeight}rem`;
  }

  private getBackgroundImageUrl() {
    const fallbackImage =
      this.config.fallbackArtwork ??
      (this.activePlayer.attributes.media_title === 'TV' ? TV_BASE64_IMAGE : MUSIC_NOTES_BASE64_IMAGE);
    const fallbackBackgroundUrl = `url(${fallbackImage})`;
    const image = this.getArtworkImage();
    if (image?.entityImage) {
      return `url(${image.entityImage}), ${fallbackBackgroundUrl}`;
    } else {
      return fallbackBackgroundUrl;
    }
  }

  private getBackgroundImage() {
    const fallbackImage =
      this.config.fallbackArtwork ??
      (this.activePlayer.attributes.media_title === 'TV' ? TV_BASE64_IMAGE : MUSIC_NOTES_BASE64_IMAGE);
    const fallbackBackgroundUrl = `url(${fallbackImage})`;
    const image = this.getArtworkImage();
    if (image) {
      return `background-image: url(${image.entityImage}), ${fallbackBackgroundUrl}${image.sizePercentage ? `; background-size: ${image.sizePercentage}%` : ''
        }`;
    } else {
      return `background-image: ${fallbackBackgroundUrl}`;
    }
  }

  private getMatchingOverride(entityImage?: string) {
    const overrides = this.config.mediaArtworkOverrides;
    if (!overrides) return undefined;

    const { media_title, media_artist, media_album_name, media_content_id, media_channel } =
      this.activePlayer.attributes;

    let override = overrides.find(
      (value) =>
        (media_title && media_title === value.mediaTitleEquals) ||
        (media_artist && media_artist === value.mediaArtistEquals) ||
        (media_album_name && media_album_name === value.mediaAlbumNameEquals) ||
        (media_channel && media_channel === value.mediaChannelEquals) ||
        (media_content_id && media_content_id === value.mediaContentIdEquals),
    );
    if (!override) {
      override = overrides.find((value) => !entityImage && value.ifMissing);
    }
    return override;
  }

  private getArtworkImage() {
    const prefix = this.config.artworkHostname || '';
    const { entity_picture, entity_picture_local, app_id } = this.activePlayer.attributes;
    let entityImage = entity_picture ? prefix + entity_picture : entity_picture;
    if (app_id === 'music_assistant') {
      entityImage = entity_picture_local ? prefix + entity_picture_local : entity_picture;
    }
    let sizePercentage = undefined;
    const override = this.getMatchingOverride(entityImage);
    if (override?.imageUrl) {
      if (override.imageUrl.includes('{{')) {
        entityImage = this.resolvedImageUrl ?? '';
      } else {
        entityImage = override.imageUrl;
      }
      sizePercentage = override?.sizePercentage ?? sizePercentage;
    }
    return { entityImage, sizePercentage };
  }

  private resolveTemplateImageUrlIfNeeded() {
    const override = this.getMatchingOverride(this.activePlayer.attributes.entity_picture);
    const templateUrl = override?.imageUrl?.includes('{{') ? override.imageUrl : undefined;

    if (templateUrl && this.lastTemplateUrl !== templateUrl) {
      this.lastTemplateUrl = templateUrl;
      this.store.hassService.renderTemplate<string>(templateUrl, '').then((result) => {
        this.resolvedImageUrl = result;
      });
    } else if (!templateUrl) {
      this.lastTemplateUrl = undefined;
      this.resolvedImageUrl = undefined;
    }
  }

  static get styles() {
    return css`
      .hoverable:focus,
      .hoverable:hover {
        color: var(--accent-color);
      }

      .hoverable:active {
        color: var(--primary-color);
      }

      .container {
        position: relative;
        display: grid;
        grid-template-columns: 100%;
        grid-template-rows: min-content auto min-content;
        grid-template-areas:
          'header'
          'artwork'
          'controls';
        min-height: 100%;
        background-position: center;
        background-repeat: no-repeat;
        background-size: cover;
      }

      .container.blurred-background {
        background: none;
        isolation: isolate;
        overflow: hidden;
      }

      .container.blurred-background::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-image: var(--blur-background-image);
        background-position: center;
        background-repeat: no-repeat;
        background-size: cover;
        filter: blur(var(--blur-amount));
        transform: scale(1.1);
        z-index: -1;
      }

      .header {
        grid-area: header;
        margin: 0.75rem 1.25rem;
        padding: 0.5rem;
        position: relative;
      }

      .controls {
        grid-area: controls;
        overflow-y: auto;
        margin: 0.25rem;
        padding: 0.5rem;
        position: relative;
      }

      .artwork {
        grid-area: artwork;
        align-self: center;
        flex-grow: 1;
        flex-shrink: 0;
        width: 100%;
        height: 100%;
        min-height: 5rem;
        background-position: center;
        background-repeat: no-repeat;
        background-size: contain;
        position: relative;
      }

      *[hide] {
        display: none;
      }

      *[background] {
        background-color: var(
          --background-overlay-color,
          rgba(var(--rgb-card-background-color), var(--background-opacity, 0.9))
        );
        border-radius: 10px;
      }
    `;
  }
}
