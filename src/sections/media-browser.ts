import { HomeAssistant } from 'custom-card-helpers';
import { html, LitElement } from 'lit';
import { until } from 'lit-html/directives/until.js';
import { property, state } from 'lit/decorators.js';
import '../components/media-list-item';
import '../components/media-browser-header';
import MediaBrowseService from '../services/media-browse-service';
import MediaControlService from '../services/media-control-service';
import Store from '../store';
import { CardConfig, MediaPlayerItem, Section } from '../types';
import { dispatchShowSection, listenForEntityId, listStyle, stopListeningForEntityId } from '../utils';
import { BROWSE_CLICKED, BROWSE_STATE, PLAY_DIR } from '../constants';
import { styleMap } from 'lit-html/directives/style-map.js';

const LOCAL_STORAGE_CURRENT_DIR = 'custom-sonos-card_currentDir';

export class MediaBrowser extends LitElement {
  @property() store!: Store;
  private config!: CardConfig;
  private entityId!: string;
  private hass!: HomeAssistant;
  @state() private browse!: boolean;
  @state() private currentDir?: MediaPlayerItem;
  private mediaPlayers!: string[];
  private parentDirs: MediaPlayerItem[] = [];
  private mediaControlService!: MediaControlService;
  private mediaBrowseService!: MediaBrowseService;

  entityIdListener = (event: Event) => {
    this.entityId = (event as CustomEvent).detail.entityId;
  };

  connectedCallback() {
    super.connectedCallback();
    listenForEntityId(this.entityIdListener);
    window.addEventListener(PLAY_DIR, async () => {
      await this.playItem(<MediaPlayerItem>this.currentDir);
    });
    window.addEventListener(BROWSE_CLICKED, async () => {
      await this.browseClicked();
    });
  }

  disconnectedCallback() {
    stopListeningForEntityId(this.entityIdListener);
    super.disconnectedCallback();
  }

  render() {
    ({
      config: this.config,
      hass: this.hass,
      mediaPlayers: this.mediaPlayers,
      mediaControlService: this.mediaControlService,
      mediaBrowseService: this.mediaBrowseService,
      entityId: this.entityId,
    } = this.store);
    const currentDirJson = localStorage.getItem(LOCAL_STORAGE_CURRENT_DIR);
    if (currentDirJson) {
      const currentDir = JSON.parse(currentDirJson);
      if (currentDir !== this.currentDir) {
        this.currentDir = currentDir;
        this.browse = true;
        this.dispatchBrowseState();
      }
    }
    return html`
      <sonos-media-browser-header .config=${this.config}></sonos-media-browser-header>
      ${this.entityId !== '' &&
      until(
        (this.browse ? this.loadMediaDir(this.currentDir) : this.getAllFavorites()).then((items) => {
          const itemsWithImage = MediaBrowser.itemsWithImage(items);
          return html` <mwc-list multi style="${listStyle()}">
            ${items.map((item) => {
              const itemClick = async () => await this.onMediaItemClick(item);
              return html`
                <mwc-list-item @click="${itemClick}" style="${this.mwcListItemStyle()}">
                  <sonos-media-list-item
                    .itemsWithImage="${itemsWithImage}"
                    .mediaItem="${item}"
                    .config="${this.config}"
                  ></sonos-media-list-item>
                </mwc-list-item>
              `;
            })}
          </mwc-list>`;
        }),
      )}
    `;
  }

  firstUpdated() {
    this.dispatchBrowseState();
  }

  private dispatchBrowseState() {
    const title = !this.browse ? 'All Favorites' : this.currentDir ? this.currentDir.title : 'Media Browser';
    window.dispatchEvent(
      new CustomEvent(BROWSE_STATE, {
        detail: {
          canPlay: this.currentDir?.can_play,
          browse: this.browse,
          currentDir: this.currentDir,
          title,
        },
      }),
    );
  }

  private mwcListItemStyle() {
    return styleMap({ height: '40px' });
  }

  private browseClicked() {
    if (this.parentDirs.length) {
      this.setCurrentDir(this.parentDirs.pop());
    } else if (this.currentDir) {
      this.setCurrentDir(undefined);
    } else {
      this.browse = !this.browse;
      this.dispatchBrowseState();
    }
  }

  private setCurrentDir(mediaItem?: MediaPlayerItem) {
    this.currentDir = mediaItem;
    if (mediaItem) {
      localStorage.setItem(LOCAL_STORAGE_CURRENT_DIR, JSON.stringify(mediaItem));
    } else {
      localStorage.removeItem(LOCAL_STORAGE_CURRENT_DIR);
    }
    this.dispatchBrowseState();
  }

  private async onMediaItemClick(mediaItem: MediaPlayerItem) {
    if (mediaItem.can_expand) {
      this.currentDir && this.parentDirs.push(this.currentDir);
      this.setCurrentDir(mediaItem);
    } else if (mediaItem.can_play) {
      this.playItem(mediaItem);
      setTimeout(() => dispatchShowSection(Section.PLAYER), 1000);
    }
  }

  private async playItem(mediaItem: MediaPlayerItem) {
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
    return items.some((item) => item.thumbnail);
  }

  private async loadMediaDir(mediaItem?: MediaPlayerItem) {
    return await (mediaItem
      ? this.mediaBrowseService.getDir(this.entityId, mediaItem, this.config.mediaBrowserTitlesToIgnore)
      : this.mediaBrowseService.getRoot(this.entityId, this.config.mediaBrowserTitlesToIgnore));
  }
}
