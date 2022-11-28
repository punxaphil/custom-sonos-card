import { html, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';
import { CardConfig, MediaPlayerItem } from '../types';
import {
  buttonSectionStyle,
  getMediaPlayers,
  getWidth,
  listenForEntityId,
  noPlayerHtml,
  sharedStyle,
  stopListeningForEntityId,
  stylable,
  validateConfig,
  wrapInHaCardUnlessAllSectionsShown,
} from '../utils';
import { until } from 'lit-html/directives/until.js';
import '../components/media-list-item';
import '../components/media-icon-item';
import '../components/media-browser-header';
import { HomeAssistant } from 'custom-card-helpers';
import HassService from '../services/hass-service';
import MediaControlService from '../services/media-control-service';
import MediaBrowseService from '../services/media-browse-service';

const LOCAL_STORAGE_CURRENT_DIR = 'custom-sonos-card_currentDir';

export class MediaBrowser extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property() config!: CardConfig;
  @state() private browse!: boolean;
  @state() private currentDir?: MediaPlayerItem;
  @state() private mediaItems: MediaPlayerItem[] = [];
  @state() private entityId!: string;
  private mediaPlayers!: string[];
  private parentDirs: MediaPlayerItem[] = [];
  private mediaControlService!: MediaControlService;
  private mediaBrowseService!: MediaBrowseService;
  private hassService!: HassService;

  entityIdListener = (event: Event) => {
    this.entityId = (event as CustomEvent).detail.entityId;
  };

  connectedCallback() {
    super.connectedCallback();
    listenForEntityId(this.entityIdListener);
  }

  disconnectedCallback() {
    stopListeningForEntityId(this.entityIdListener);
    super.disconnectedCallback();
  }

  setConfig(config: CardConfig) {
    const parsed = JSON.parse(JSON.stringify(config));
    validateConfig(parsed);
    this.config = parsed;
  }

  render() {
    if (!this.entityId && this.config.entityId) {
      this.entityId = this.config.entityId;
    }
    if (this.entityId && this.hass) {
      this.hassService = new HassService(this.hass);
      this.mediaBrowseService = new MediaBrowseService(this.hass, this.hassService);
      this.mediaControlService = new MediaControlService(this.hass, this.hassService);
      this.mediaPlayers = getMediaPlayers(this.config, this.hass);
      const currentDirJson = localStorage.getItem(LOCAL_STORAGE_CURRENT_DIR);
      if (currentDirJson) {
        this.currentDir = JSON.parse(currentDirJson);
        this.browse = true;
      }
      const cardHtml = html`
        <div style="${buttonSectionStyle(this.config, { textAlign: 'center' })}">
          <sonos-media-browser-header
            .config=${this.config}
            .hass=${this.hass}
            .mediaBrowser=${this}
            .browse=${this.browse}
            .currentDir=${this.currentDir}
          ></sonos-media-browser-header>
          ${this.entityId !== '' &&
          until(
            (this.browse ? this.loadMediaDir(this.currentDir) : this.getAllFavorites()).then((items) => {
              const itemsWithImage = MediaBrowser.itemsWithImage(items);
              const mediaItemWidth = itemsWithImage
                ? getWidth(this.config, '33%', '16%', this.config.layout?.mediaItem)
                : '100%';
              return html` <div style="${this.mediaButtonsStyle(itemsWithImage)}">
                ${items.map((mediaItem) => {
                  if (this.config.mediaBrowserItemsAsList) {
                    return html`
                      <sonos-media-list-item
                        style="width: 100%;max-width: 100%;"
                        .mediaItem="${mediaItem}"
                        .config="${this.config}"
                        @click="${() => this.onMediaItemClick(mediaItem)}"
                      ></sonos-media-list-item>
                    `;
                  } else {
                    return html`
                      <sonos-media-icon-item
                        style="width: ${mediaItemWidth};max-width: ${mediaItemWidth};"
                        .mediaItem="${mediaItem}"
                        .config="${this.config}"
                        @click="${async () => await this.onMediaItemClick(mediaItem)}"
                        .hass=${this.hass}
                      ></sonos-media-icon-item>
                    `;
                  }
                })}
              </div>`;
            }),
          )}
        </div>
      `;
      return wrapInHaCardUnlessAllSectionsShown(cardHtml, this.config);
    } else {
      return noPlayerHtml;
    }
  }

  browseClicked() {
    if (this.parentDirs.length) {
      this.setCurrentDir(this.parentDirs.pop());
    } else if (this.currentDir) {
      this.setCurrentDir(undefined);
    } else {
      this.browse = !this.browse;
    }
  }

  private setCurrentDir(mediaItem?: MediaPlayerItem) {
    this.currentDir = mediaItem;
    if (mediaItem) {
      localStorage.setItem(LOCAL_STORAGE_CURRENT_DIR, JSON.stringify(mediaItem));
    } else {
      localStorage.removeItem(LOCAL_STORAGE_CURRENT_DIR);
    }
  }

  private async onMediaItemClick(mediaItem: MediaPlayerItem) {
    if (mediaItem.can_expand) {
      this.currentDir && this.parentDirs.push(this.currentDir);
      this.setCurrentDir(mediaItem);
    } else if (mediaItem.can_play) {
      await this.playItem(mediaItem);
    }
  }

  async playItem(mediaItem: MediaPlayerItem) {
    if (mediaItem.media_content_type || mediaItem.media_content_id) {
      await this.mediaControlService.playMedia(this.entityId, mediaItem);
    } else {
      await this.mediaControlService.setSource(this.entityId, mediaItem.title);
    }
  }

  private async getAllFavorites() {
    let allFavorites = await this.mediaBrowseService.getAllFavorites(
      this.mediaPlayers,
      this.config.mediaBrowserTitlesToIgnore,
    );
    if (this.config.shuffleFavorites) {
      MediaBrowser.shuffleArray(allFavorites);
    } else {
      allFavorites = allFavorites.sort((a, b) => a.title.localeCompare(b.title, 'en', { sensitivity: 'base' }));
    }
    return [
      ...(this.config.customSources?.[this.entityId]?.map(MediaBrowser.createSource) || []),
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

  private static itemsWithImage(items: MediaPlayerItem[]) {
    return items.some((item) => item.thumbnail || item.can_expand);
  }

  private async loadMediaDir(mediaItem?: MediaPlayerItem) {
    return await (mediaItem
      ? this.mediaBrowseService.getDir(this.entityId, mediaItem, this.config.mediaBrowserTitlesToIgnore)
      : this.mediaBrowseService.getRoot(this.entityId, this.config.mediaBrowserTitlesToIgnore));
  }

  private mediaButtonsStyle(itemsWithImage: boolean) {
    return stylable('media-buttons', this.config, {
      padding: '0',
      display: 'flex',
      flexWrap: 'wrap',
      ...(!itemsWithImage && { flexDirection: 'column' }),
    });
  }

  static get styles() {
    return sharedStyle;
  }
}
