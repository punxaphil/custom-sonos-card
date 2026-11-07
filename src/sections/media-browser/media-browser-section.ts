import { css, html, LitElement } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { mdiDotsVertical, mdiFolderStar, mdiFolderStarOutline, mdiPlayBoxMultiple } from '@mdi/js';
import Store from '../../model/store';
import './favorites/favorites';
import './browser';
import '../../components/icon-button';
import { MediaBrowserBrowser } from './browser';
import { MEDIA_ITEM_SELECTED } from '../../constants';
import { customEvent, getSpeakerList } from '../../utils/utils';
import { mediaBrowserStyles } from './styles';
import { menuStyles, navHeaderStyles, renderMenuPanel } from './browse-menu';
import { browserText } from './i18n';
import { classMap } from 'lit/directives/class-map.js';
import { renderShortcutButton } from './utils';
import { LayoutType, ViewType } from './media-browser.types';

const START_PATH_KEY = 'sonos-card-media-browser-start';
const LAYOUT_KEY = 'sonos-card-media-browser-layout';
const FAVORITES_VIEW = 'favorites';

let currentView: ViewType | null = null;

export class MediaBrowser extends LitElement {
  @property({ attribute: false }) store!: Store;
  @state() private isCurrentPathStart = false;
  @state() private layout: LayoutType = 'auto';
  @state() private view: ViewType = 'favorites';
  @state() private menuOpen = false;
  @query('sonos-media-browser-browser') private browserComponent?: MediaBrowserBrowser;

  connectedCallback() {
    super.connectedCallback();
    this.initializeView();
    this.loadLayout();
  }

  private loadLayout() {
    const savedLayout = localStorage.getItem(LAYOUT_KEY) as LayoutType | null;
    if (savedLayout && ['auto', 'grid', 'list'].includes(savedLayout)) {
      this.layout = savedLayout;
    }
  }

  private setLayout(layout: LayoutType) {
    this.layout = layout;
    localStorage.setItem(LAYOUT_KEY, layout);
  }

  private initializeView() {
    const onlyFavorites = this.store.config.mediaBrowser?.onlyFavorites ?? false;
    if (onlyFavorites) {
      this.view = 'favorites';
      this.updateIsCurrentPathStart();
      return;
    }
    if (currentView !== null) {
      this.view = currentView;
      this.updateIsCurrentPathStart();
      return;
    }
    const startPath = localStorage.getItem(START_PATH_KEY);
    if (startPath && startPath !== FAVORITES_VIEW) {
      this.view = 'browser';
    } else {
      this.view = 'favorites';
    }
    this.updateIsCurrentPathStart();
  }

  private updateIsCurrentPathStart() {
    const startPath = localStorage.getItem(START_PATH_KEY);
    if (this.view === 'favorites') {
      this.isCurrentPathStart = startPath === FAVORITES_VIEW || startPath === null;
    } else {
      this.isCurrentPathStart = false; // Browser component manages its own start path state
    }
  }

  private toggleStartPath = () => {
    if (this.isCurrentPathStart) {
      localStorage.removeItem(START_PATH_KEY);
    } else {
      localStorage.setItem(START_PATH_KEY, FAVORITES_VIEW);
    }
    this.isCurrentPathStart = !this.isCurrentPathStart;
  };

  private goToFavorites = () => {
    this.view = 'favorites';
    currentView = 'favorites';
    this.updateIsCurrentPathStart();
  };

  private goToBrowser = () => {
    this.view = 'browser';
    currentView = 'browser';
    this.updateIsCurrentPathStart();
  };

  private onShortcutClick = () => {
    const shortcut = this.store.config.mediaBrowser?.shortcut;
    if (!shortcut) {
      return;
    }
    this.view = 'browser';
    currentView = 'browser';
    void this.updateComplete.then(() => this.browserComponent?.navigateToShortcut(shortcut));
  };

  private onMediaItemSelected = (event: CustomEvent) => {
    this.dispatchEvent(customEvent(MEDIA_ITEM_SELECTED, event.detail));
  };

  private onBrowserLayoutChange = (event: CustomEvent) => {
    this.setLayout(event.detail as LayoutType);
  };

  render() {
    return this.view === 'favorites' ? this.renderFavorites() : this.renderBrowser();
  }

  private renderFavorites() {
    const config = this.store.config.mediaBrowser ?? {};
    const playerName = getSpeakerList(this.store.activePlayer, this.store.predefinedGroups);
    const onlyFavorites = config.onlyFavorites ?? false;
    const hideActivePlayerName = config.hideActivePlayerName ?? false;

    const t = (key: Parameters<typeof browserText>[1]) => browserText(this.store.hass, key);

    return html`
      ${
        config.hideHeader
          ? ''
          : html`<div class="nav-header">
              <div class="row">
                <div class="spacer"></div>
                <div class="title-section">
                  <span class="title">${config.favorites?.title ?? t('favorites')}</span>
                  <span class="player-name" ?hidden=${hideActivePlayerName}>${playerName}</span>
                </div>
                ${onlyFavorites ? '' : renderShortcutButton(config.shortcut, this.onShortcutClick)}
                ${onlyFavorites ? '' : html`<sonos-icon-button .path=${mdiPlayBoxMultiple} @click=${this.goToBrowser} title=${t('browse')}></sonos-icon-button>`}
                <sonos-icon-button
                  class=${classMap({ 'menu-open': this.menuOpen })}
                  .path=${mdiDotsVertical}
                  @click=${() => (this.menuOpen = !this.menuOpen)}
                  title=${t('menu')}
                ></sonos-icon-button>
              </div>
            </div>`
      }
      ${
        this.menuOpen
          ? renderMenuPanel({
              hass: this.store.hass,
              layout: this.layout,
              onLayout: (layout) => {
                this.menuOpen = false;
                this.setLayout(layout);
              },
              rows: onlyFavorites
                ? []
                : [
                    {
                      icon: this.isCurrentPathStart ? mdiFolderStar : mdiFolderStarOutline,
                      label: t('setStart'),
                      checked: this.isCurrentPathStart,
                      onClick: this.toggleStartPath,
                    },
                  ],
              onClose: () => (this.menuOpen = false),
            })
          : ''
      }
      <sonos-favorites .store=${this.store} .layout=${this.layout} @item-selected=${this.onMediaItemSelected}></sonos-favorites>
    `;
  }

  private renderBrowser() {
    return html`
      <sonos-media-browser-browser
        .store=${this.store}
        .layout=${this.layout}
        @item-selected=${this.onMediaItemSelected}
        @go-to-favorites=${this.goToFavorites}
        @layout-change=${this.onBrowserLayoutChange}
      ></sonos-media-browser-browser>
    `;
  }

  static get styles() {
    return [
      mediaBrowserStyles,
      menuStyles,
      navHeaderStyles,
      css`
        :host {
          position: relative;
        }
      `,
    ];
  }
}
