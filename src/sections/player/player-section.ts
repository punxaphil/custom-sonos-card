import { html, LitElement, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import Store from '../../model/store';
import { playerSectionStyles } from './player-section.styles';
import { findArtworkOverride, getArtworkImage, getArtworkStyle, getBackgroundImage, getBackgroundImageUrl } from './player-artwork-utils';
import './player-controls';
import './player-header';
import './player-progress';
import '../../components/volume';

export class Player extends LitElement {
  @property({ attribute: false }) store!: Store;
  @state() private resolvedImageUrl?: string;
  @state() private imageLoaded = false;
  private lastTemplateUrl?: string;
  private lastCheckedImageUrl?: string;

  render() {
    this.resolveTemplateImageUrlIfNeeded();
    this.preloadImageIfNeeded();
    const {
      artworkAsBackgroundBlur: blurAmount = 0,
      artworkAsBackground: artworkAsBackgroundConfig,
      controlsAndHeaderBackgroundOpacity: backgroundOpacity = 0.9,
      backgroundOverlayColor: overlayColor,
      hideArtwork: hideArtworkConfig,
      controlsMargin,
      hideHeader,
      hideControls,
    } = this.store.config.player ?? {};
    const hasRealArtwork = getArtworkImage(this.store, this.resolvedImageUrl).entityImage && this.imageLoaded;
    const artworkAsBackground = (!!artworkAsBackgroundConfig || blurAmount > 0) && hasRealArtwork;
    const opacityStyle = `--background-opacity: ${backgroundOpacity}${overlayColor ? `; --background-overlay-color: ${overlayColor}` : ''}`;
    const containerStyle = artworkAsBackground
      ? blurAmount > 0
        ? `--blur-background-image: ${getBackgroundImageUrl(this.store, this.imageLoaded, this.resolvedImageUrl)}; --blur-amount: ${blurAmount}px; ${opacityStyle}`
        : `${getBackgroundImage(this.store, this.imageLoaded, this.resolvedImageUrl)}; ${opacityStyle}`
      : '';
    const hideArtwork = (artworkAsBackground && !blurAmount) || !!hideArtworkConfig;
    const controlsMarginStyle = controlsMargin ? `margin: ${controlsMargin}` : '';
    return html`
      <div class="container ${blurAmount > 0 ? 'blurred-background' : ''}" style=${containerStyle || nothing}>
        <sonos-player-header class="header" background=${artworkAsBackground || nothing} .store=${this.store} ?hidden=${!!hideHeader}></sonos-player-header>
        <div class="artwork" ?hidden=${hideArtwork} style=${getArtworkStyle(this.store, this.imageLoaded, this.resolvedImageUrl)}></div>
        <sonos-player-controls
          class="controls"
          background=${artworkAsBackground || nothing}
          .store=${this.store}
          ?hidden=${!!hideControls}
          style=${controlsMarginStyle || nothing}
        ></sonos-player-controls>
      </div>
    `;
  }

  static get styles() {
    return playerSectionStyles;
  }

  private preloadImageIfNeeded() {
    const imageUrl = getArtworkImage(this.store, this.resolvedImageUrl)?.entityImage;
    if (imageUrl === this.lastCheckedImageUrl) {
      return;
    }
    this.lastCheckedImageUrl = imageUrl;
    if (!imageUrl) {
      this.imageLoaded = false;
      return;
    }
    const img = new Image();
    img.onload = () => {
      if (this.lastCheckedImageUrl === imageUrl) {
        this.imageLoaded = true;
      }
    };
    img.onerror = () => {
      if (this.lastCheckedImageUrl === imageUrl) {
        this.imageLoaded = false;
      }
    };
    img.src = imageUrl;
  }

  private resolveTemplateImageUrlIfNeeded() {
    const override = findArtworkOverride(this.store, this.store.activePlayer.attributes.entity_picture);
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
}
