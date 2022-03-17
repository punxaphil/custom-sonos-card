import { css, html, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';
import MediaBrowseService from '../services/media-browse-service';
import { HomeAssistant } from 'custom-card-helpers';
import { CardConfig, MediaPlayerItem, Members } from '../types';
import { getWidth } from '../utils';
import MediaControlService from '../services/media-control-service';
import { until } from 'lit-html/directives/until.js';
import sharedStyle from '../sharedStyle';

class MediaBrowser extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property() config!: CardConfig;
  @property() activePlayer!: string;
  @property() mediaBrowseService!: MediaBrowseService;
  @property() mediaControlService!: MediaControlService;
  @property() mediaPlayers!: string[];
  @property() members!: Members;
  @state() private browse!: boolean;
  @state() private currentDir?: MediaPlayerItem;

  @state() private mediaItems: MediaPlayerItem[] = [];
  private parentDirs: MediaPlayerItem[] = [];

  render() {
    return html`
      <div class="${this.config.backgroundBehindButtonSections ? 'button-section-background' : ''}">
        <div class="header">
          <div class="play-dir">
            ${this.currentDir?.can_play
              ? html` <ha-icon
                  .icon=${'mdi:play'}
                  @click="${() => this.playItem(<MediaPlayerItem>this.currentDir)}"
                ></ha-icon>`
              : ''}
          </div>
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
              ? html` <ha-icon .icon=${'mdi:arrow-left-bold'}></ha-icon>`
              : html` <ha-icon .icon=${'mdi:play-box-multiple'}></ha-icon> `}
          </div>
        </div>
        ${this.activePlayer !== '' &&
        until(
          (this.browse ? this.loadMediaDir(this.currentDir) : this.getAllFavorites()).then((items) => {
            const itemsWithoutImage = MediaBrowser.itemsWithoutImage(items);
            const mediaItemWidth = itemsWithoutImage
              ? getWidth(this.config, '33%', '16%', this.config.layout?.mediaItem)
              : '100%';
            return html` <div class="media-buttons ${itemsWithoutImage ? '' : 'no-thumbs'}">
              ${items.map(
                (mediaItem) => html`
                  <sonos-media-button
                    style="width: ${mediaItemWidth};max-width: ${mediaItemWidth};"
                    .mediaItem="${mediaItem}"
                    @click="${() => this.onMediaItemClick(mediaItem)}"
                  />
                `,
              )}
            </div>`;
          }),
        )}
      </div>
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
      const master = this.getMasterIfCustomSource(mediaItem) || this.activePlayer;
      if (master !== this.activePlayer) {
        this.switchMasterAndPlay(master, mediaItem);
      } else {
        this.mediaControlService.setSource(master, mediaItem.title);
      }
    }
  }

  private switchMasterAndPlay(master: string, mediaItem: MediaPlayerItem) {
    this.mediaControlService.join(master, ...Object.keys(this.members), this.activePlayer);
    setTimeout(() => {
      this.mediaControlService.setSource(master, mediaItem.title);
    }, 3000);
  }

  private getMasterIfCustomSource(mediaItem: MediaPlayerItem) {
    let result: string | undefined;
    if (mediaItem.customForEntity && this.config.customSources) {
      result = Object.keys(this.config.customSources).find((entity: string) => {
        return (
          mediaItem.customForEntity === entity &&
          this.config.customSources?.[entity].find((customItem) => customItem.title === mediaItem.title)
        );
      });
    }
    return result;
  }

  private async getAllFavorites() {
    let allFavorites = await this.mediaBrowseService.getAllFavorites(this.mediaPlayers);
    if (this.config.shuffleFavorites) {
      MediaBrowser.shuffleArray(allFavorites);
    } else {
      allFavorites = allFavorites.sort((a, b) => a.title.localeCompare(b.title, 'en', { sensitivity: 'base' }));
    }
    const customMemberFavorites = [...Object.keys(this.members), this.activePlayer]?.flatMap(
      (member) => this.config.customSources?.[member]?.map(MediaBrowser.createSource(member)) || [],
    );
    return [
      ...customMemberFavorites,
      ...(this.config.customSources?.all?.map(MediaBrowser.createSource('all')) || []),
      ...allFavorites,
    ];
  }

  private static createSource(entity: string) {
    return (source: MediaPlayerItem) => {
      return { ...source, can_play: true, customForEntity: entity };
    };
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
          margin: 0.5rem 0;
          font-weight: bold;
          font-size: larger;
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
