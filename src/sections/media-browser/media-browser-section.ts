import { html, LitElement } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { mdiFolderStar, mdiFolderStarOutline, mdiPlayBoxMultiple } from '@mdi/js';
import Store from '../../model/store';
import './favorites/favorites';
import './browser';
import { MediaBrowserBrowser } from './browser';
import { MEDIA_ITEM_SELECTED } from '../../constants';
import { customEvent } from '../../utils/utils';
import { mediaBrowserStyles } from './styles';
import { renderLayoutMenu } from './layout-menu';
import { renderShortcutButton } from './utils';

type LayoutType = 'auto' | 'grid' | 'list';
type ViewType = 'favorites' | 'browser';

const START_PATH_KEY = 'sonos-card-media-browser-start';
const LAYOUT_KEY = 'sonos-card-media-browser-layout';
const FAVORITES_VIEW = 'favorites';

let currentView: ViewType | null = null;

export class MediaBrowser extends LitElement {
  @property({ attribute: false }) store!: Store;
  @state() private isCurrentPathStart = false;
  @state() private layout: LayoutType = 'auto';
  @state() private view: ViewType = 'favorites';
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

  private handleMenuAction = (ev: CustomEvent<{ item: { value: string } }>) => {
    this.setLayout(ev.detail.item.value as LayoutType);
  };

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
    const title = config.favorites?.title ?? 'Favorites';
    const onlyFavorites = config.onlyFavorites ?? false;

    return html`
      ${config.hideHeader
        ? ''
        : html`<div class="header">
            <div class="spacer"></div>
            <span class="title">${title}</span>
            ${onlyFavorites ? '' : renderShortcutButton(config.shortcut, this.onShortcutClick)}
            ${onlyFavorites
              ? ''
              : html`<ha-icon-button .path=${mdiPlayBoxMultiple} @click=${this.goToBrowser} title="Browse Media"></ha-icon-button>
                  <ha-icon-button
                    class=${this.isCurrentPathStart ? 'startpath-active' : ''}
                    .path=${this.isCurrentPathStart ? mdiFolderStar : mdiFolderStarOutline}
                    @click=${this.toggleStartPath}
                    title=${this.isCurrentPathStart ? 'Unset start page' : 'Set as start page'}
                  ></ha-icon-button>`}
            ${renderLayoutMenu(this.layout, this.handleMenuAction)}
          </div>`}
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
    return mediaBrowserStyles;
  }
}
