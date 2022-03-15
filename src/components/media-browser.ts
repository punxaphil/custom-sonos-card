import { css, html, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';
import MediaBrowseService from '../services/media-browse-service';
import { CardConfig, MediaPlayerItem } from '../types';
import { getWidth } from '../utils';
import MediaControlService from '../services/media-control-service';
import { until } from 'lit-html/directives/until.js';
import sharedStyle from '../sharedStyle';
import { CustomSonosCard } from '../main';
import './media-button';

class MediaBrowser extends LitElement {
  @property() main!: CustomSonosCard;
  @property() mediaPlayers!: string[];
  @state() private browse!: boolean;
  @state() private currentDir?: MediaPlayerItem;
  @state() private mediaItems: MediaPlayerItem[] = [];
  private parentDirs: MediaPlayerItem[] = [];
  private config!: CardConfig;
  private activePlayer!: string;
  private mediaControlService!: MediaControlService;
  private mediaBrowseService!: MediaBrowseService;

  render() {
    this.config = this.main.config;
    this.activePlayer = this.main.activePlayer;
    this.mediaControlService = this.main.mediaControlService;
    this.mediaBrowseService = this.main.mediaBrowseService;
    const stylable = this.main.stylable;
    const styleConfigForName = (name: string) => {
      return { config: this.config, name };
    };
    return html`
      <div-styled .using="${styleConfigForName('button-section')}">
        <div-styled .using="${styleConfigForName('media-browser-header')}">
          <div-styled .using="${styleConfigForName('media-browser-play-dir')}">
            ${this.currentDir?.can_play
              ? html` <ha-icon
                  .icon=${'mdi:play'}
                  @click="${() => this.playItem(<MediaPlayerItem>this.currentDir)}"
                ></ha-icon>`
              : ''}
          </div-styled>
          <div-styled .using="${styleConfigForName('title')}">
            ${this.config.mediaTitle ? this.config.mediaTitle : 'Media'}
          </div-styled>
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
              ? html` <ha-icon .icon=${'mdi:arrow-left-bold'}></ha-icon>`
              : html` <ha-icon .icon=${'mdi:play-box-multiple'}></ha-icon> `}
          </div>
        </div-styled>
        ${this.activePlayer !== '' &&
        until(
          (this.browse ? this.loadMediaDir(this.currentDir) : this.getAllFavorites()).then((items) => {
            const itemsWithoutImage = MediaBrowser.itemsWithoutImage(items);
            const mediaItemWidth = itemsWithoutImage
              ? getWidth(this.config, '33%', '16%', this.config.layout?.mediaItem)
              : '100%';
            return html` <div
              class="media-buttons ${itemsWithoutImage ? '' : 'no-thumbs'}"
              style="${stylable('mediaButtons')}"
            >
              ${items.map(
                (mediaItem) => html`
                  <sonos-media-button
                    style="width: ${mediaItemWidth};max-width: ${mediaItemWidth};"
                    .mediaItem="${mediaItem}"
                    @click="${() => this.onMediaItemClick(mediaItem)}"
                    .main="${this.main}"
                  ></sonos-media-button>
                `,
              )}
            </div>`;
          }),
        )}
      </div-styled>
    `;
  }

  private onMediaItemClick(mediaItem: MediaPlayerItem) {
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
    let allFavorites = await this.mediaBrowseService.getAllFavorites(this.mediaPlayers);
    if (this.config.shuffleFavorites) {
      MediaBrowser.shuffleArray(allFavorites);
    } else {
      allFavorites = allFavorites.sort((a, b) => a.title.localeCompare(b.title, 'en', { sensitivity: 'base' }));
    }
    return [
      ...(this.config.customSources?.[this.activePlayer]?.map(MediaBrowser.createSource) || []),
      ...(this.config.customSources?.all?.map(MediaBrowser.createSource) || []),
      ...allFavorites,
    ];
  }

  private static createSource(source: MediaPlayerItem) {
    return { ...source, can_play: true };
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
    return [
      sharedStyle,
      css`
        :host {
          text-align: center;
        }
        .header {
          color: var(--sonos-int-title-color);
          display: flex;
          justify-content: space-between;
        }
        .header div {
          flex: 1;
          --mdc-icon-size: 1.5rem;
        }
        .media-buttons {
          padding: 0;
          display: flex;
          flex-wrap: wrap;
        }
        .no-thumbs {
          flex-direction: column;
        }
        .browse {
          text-align: right;
          padding-right: 0.5rem;
          margin-left: -0.5rem;
        }
        .play-dir {
          text-align: left;
          padding-right: -0.5rem;
          margin-left: 0.5rem;
        }
        .browse:focus,
        .browse:hover,
        .play-dir:focus,
        .play-dir:hover {
          color: var(--sonos-int-accent-color);
        }
      `,
    ];
  }
}

customElements.define('sonos-media-browser', MediaBrowser);
