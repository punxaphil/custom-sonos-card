import { html, LitElement } from 'lit';
import { until } from 'lit-html/directives/until.js';
import { property, state } from 'lit/decorators.js';
import '../components/media-browser-list';
import '../components/media-browser-icons';
import '../components/media-browser-header';
import MediaBrowseService from '../services/media-browse-service';
import MediaControlService from '../services/media-control-service';
import Store from '../model/store';
import { CardConfig, MediaPlayerItem, Section } from '../types';
import { dispatchShowSection } from '../utils/utils';
import { BROWSE_CLICKED, BROWSE_STATE, MEDIA_ITEM_SELECTED, PLAY_DIR } from '../constants';
import { MediaPlayer } from '../model/media-player';

const LOCAL_STORAGE_CURRENT_DIR = 'custom-sonos-card_currentDir';

export class MediaBrowser extends LitElement {
  @property() store!: Store;
  private config!: CardConfig;
  private activePlayer!: MediaPlayer;
  @state() private browse!: boolean;
  @state() private currentDir?: MediaPlayerItem;
  private mediaPlayers!: MediaPlayer[];
  private parentDirs: MediaPlayerItem[] = [];
  private mediaControlService!: MediaControlService;
  private mediaBrowseService!: MediaBrowseService;

  private readonly playDirListener = async () => {
    await this.playItem(<MediaPlayerItem>this.currentDir);
  };

  private readonly browseClickedListener = async () => {
    this.browseClicked();
  };

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener(PLAY_DIR, this.playDirListener);
    window.addEventListener(BROWSE_CLICKED, this.browseClickedListener);
    window.addEventListener(MEDIA_ITEM_SELECTED, this.onMediaItemSelected);
  }

  disconnectedCallback() {
    window.removeEventListener(PLAY_DIR, this.playDirListener);
    window.removeEventListener(BROWSE_CLICKED, this.browseClickedListener);
    window.removeEventListener(MEDIA_ITEM_SELECTED, this.onMediaItemSelected);
    super.disconnectedCallback();
  }

  render() {
    this.config = this.store.config;
    this.activePlayer = this.store.activePlayer;
    this.mediaBrowseService = this.store.mediaBrowseService;
    this.mediaPlayers = this.store.allMediaPlayers;
    this.mediaControlService = this.store.mediaControlService;

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
      ${this.activePlayer &&
      until(
        (this.browse ? this.loadMediaDir(this.currentDir) : this.getAllFavorites()).then((items) => {
          return this.config.mediaBrowserItemsPerRow > 1
            ? html`<sonos-media-browser-icons .items=${items} .store=${this.store}></sonos-media-browser-icons>`
            : html` <sonos-media-browser-list .items=${items} .store=${this.store}></sonos-media-browser-list>`;
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

  private onMediaItemSelected = (event: Event) => {
    const mediaItem = (event as CustomEvent).detail;
    if (mediaItem.can_expand) {
      this.currentDir && this.parentDirs.push(this.currentDir);
      this.setCurrentDir(mediaItem);
    } else if (mediaItem.can_play) {
      this.playItem(mediaItem);
      setTimeout(() => dispatchShowSection(Section.PLAYER), 1000);
    }
  };

  private async playItem(mediaItem: MediaPlayerItem) {
    if (mediaItem.media_content_type || mediaItem.media_content_id) {
      await this.mediaControlService.playMedia(this.activePlayer, mediaItem);
    } else {
      await this.mediaControlService.setSource(this.activePlayer, mediaItem.title);
    }
  }

  private async getAllFavorites() {
    let allFavorites = await this.mediaBrowseService.getAllFavorites(
      this.mediaPlayers,
      this.config.mediaBrowserTitlesToIgnore,
    );
    allFavorites = allFavorites.sort((a, b) => a.title.localeCompare(b.title, 'en', { sensitivity: 'base' }));
    return [
      ...(this.config.customSources?.[this.activePlayer.id]?.map(MediaBrowser.createSource) || []),
      ...(this.config.customSources?.all?.map(MediaBrowser.createSource) || []),
      ...allFavorites,
    ];
  }

  private static createSource(source: MediaPlayerItem) {
    return { ...source, can_play: true };
  }

  private async loadMediaDir(mediaItem?: MediaPlayerItem) {
    return await (mediaItem
      ? this.mediaBrowseService.getDir(this.activePlayer, mediaItem, this.config.mediaBrowserTitlesToIgnore)
      : this.mediaBrowseService.getRoot(this.activePlayer, this.config.mediaBrowserTitlesToIgnore));
  }
}
