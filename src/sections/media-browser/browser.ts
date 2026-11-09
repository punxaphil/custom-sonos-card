import { css, html, LitElement, nothing, PropertyValues } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import {
  mdiArrowLeft,
  mdiChevronRight,
  mdiClose,
  mdiDotsVertical,
  mdiFolderStar,
  mdiFolderStarOutline,
  mdiHome,
  mdiMagnify,
  mdiPlay,
  mdiPlayBoxMultiple,
  mdiPlaylistPlus,
  mdiSkipNext,
  mdiStar,
} from '@mdi/js';
import Store from '../../model/store';
import '../../upstream/ha-media-player-browse';
import '../../components/icon-button';
import { HaMediaPlayerBrowse } from '../../upstream/ha-media-player-browse';
import { MEDIA_ITEM_SELECTED } from '../../constants';
import { customEvent, getSpeakerList } from '../../utils/utils';
import { MediaBrowserShortcut, MediaPlayerItem } from '../../types';
import { keyed } from 'lit/directives/keyed.js';
import { classMap } from 'lit/directives/class-map.js';
import { mediaBrowserStyles } from './styles';
import { playAll, renderShortcutButton } from './utils';
import { MenuRow, menuStyles, navHeaderStyles, renderMenuPanel } from './browse-menu';
import { browserText, BrowserStringKey } from './i18n';
import { LayoutType } from './media-browser.types';
import { getTapAction, setTapAction, TapAction } from './play-action';

interface NavigateId {
  media_content_id?: string;
  media_content_type?: string;
  title?: string;
}

let currentPath: NavigateId[] | null = null;
let currentPathTitle = '';
/** Filter text per folder, so "back" brings the filter back too. */
const filterMemory = new Map<string, string>();

const ROOT_NAV: NavigateId = { media_content_id: undefined, media_content_type: undefined };
const START_PATH_KEY = 'sonos-card-media-browser-start';
/** Above this many items, "Play all" asks for confirmation. */
const PLAY_ALL_CONFIRM_THRESHOLD = 50;
/** Horizontal swipe distance (px) that triggers "back". */
const SWIPE_BACK_DISTANCE = 80;

function pathKey(ids: NavigateId[]) {
  return ids.map((id) => `${id.media_content_type ?? ''}|${id.media_content_id ?? ''}`).join('>');
}

export class MediaBrowserBrowser extends LitElement {
  @property({ attribute: false }) store!: Store;
  @property({ type: String }) layout = 'auto';
  @state() navigateIds: NavigateId[] = [];
  @state() currentTitle = '';
  @state() private isCurrentPathStart = false;
  @state() private playAllLoading = false;
  @state() private playAllWarning = '';
  @state() private mediaLoaded = false;
  @state() private filterText = '';
  @state() private searchOpen = false;
  @state() private menuOpen = false;
  @state() private confirmPlayAll = false;
  @state() private displayedCount = 0;
  @state() private swipeOffset = 0;
  @state() private toast = '';
  @state() private tapAction: TapAction = getTapAction();
  private toastTimer?: ReturnType<typeof setTimeout>;
  @query('sonos-ha-media-player-browse') private mediaBrowser?: HaMediaPlayerBrowse;
  @query('.filter-input') private filterInput?: HTMLInputElement;
  @query('.crumbs') private crumbs?: HTMLElement;
  private swipe?: { x: number; y: number; tracking?: boolean };

  connectedCallback() {
    super.connectedCallback();
    if (currentPath) {
      this.navigateIds = currentPath;
      this.currentTitle = currentPathTitle;
    } else {
      this.restoreFromStartPath();
    }
    this.restoreFilter();
    this.updateIsCurrentPathStart();
  }

  private t(key: BrowserStringKey, vars?: Record<string, string | number>) {
    return browserText(this.store?.hass, key, vars);
  }

  private restoreFromStartPath() {
    const startPath = localStorage.getItem(START_PATH_KEY);
    if (!startPath) {
      this.navigateIds = [ROOT_NAV];
      return;
    }
    try {
      this.navigateIds = JSON.parse(startPath);
      this.currentTitle = this.navigateIds[this.navigateIds.length - 1]?.title || '';
    } catch {
      this.navigateIds = [ROOT_NAV];
    }
  }

  /** Single entry point for every navigation: keeps the filter of each folder. */
  private setNavigateIds(ids: NavigateId[], title?: string) {
    if (pathKey(ids) !== pathKey(this.navigateIds)) {
      filterMemory.set(pathKey(this.navigateIds), this.filterText);
      this.navigateIds = ids;
      this.restoreFilter();
      this.menuOpen = false;
      this.confirmPlayAll = false;
    }
    const isRoot = ids.length === 1 && !ids[0].media_content_id;
    this.currentTitle = isRoot ? '' : (title ?? ids[ids.length - 1]?.title ?? '');
    this.saveCurrentState();
    this.updateIsCurrentPathStart();
  }

  private restoreFilter() {
    this.filterText = filterMemory.get(pathKey(this.navigateIds)) ?? '';
    this.searchOpen = !!this.filterText;
  }

  /** Open a child of the current folder (long-press "Open"). */
  openChild(item: MediaPlayerItem) {
    this.setNavigateIds([...this.navigateIds, { media_content_id: item.media_content_id, media_content_type: item.media_content_type, title: item.title }]);
  }

  navigateToShortcut(shortcut: MediaBrowserShortcut) {
    this.setNavigateIds(
      [
        ROOT_NAV,
        {
          media_content_id: shortcut.media_content_id,
          media_content_type: shortcut.media_content_type,
          title: shortcut.name,
        },
      ],
      shortcut.name || '',
    );
  }

  private saveCurrentState() {
    currentPath = this.navigateIds;
    currentPathTitle = this.currentTitle;
  }

  private updateIsCurrentPathStart() {
    const startPath = localStorage.getItem(START_PATH_KEY);
    this.isCurrentPathStart = startPath === JSON.stringify(this.navigateIds);
  }

  private toggleStartPath = () => {
    if (this.isCurrentPathStart) {
      localStorage.removeItem(START_PATH_KEY);
    } else {
      localStorage.setItem(START_PATH_KEY, JSON.stringify(this.navigateIds));
    }
    this.isCurrentPathStart = !this.isCurrentPathStart;
  };

  private goToFavorites = () => {
    this.menuOpen = false;
    this.dispatchEvent(new CustomEvent('go-to-favorites'));
  };

  private goBack = () => {
    if (this.searchOpen && this.filterText) {
      // first "back" clears the filter, like a phone
      this.closeSearch();
      return;
    }
    if (this.navigateIds.length <= 1) {
      return;
    }
    this.setNavigateIds(this.navigateIds.slice(0, -1));
  };

  private goToLevel(level: number) {
    if (level >= this.navigateIds.length - 1) {
      return;
    }
    this.setNavigateIds(this.navigateIds.slice(0, level + 1));
  }

  private openSearch = async () => {
    this.searchOpen = true;
    this.menuOpen = false;
    await this.updateComplete;
    this.filterInput?.focus();
  };

  private closeSearch = () => {
    this.filterText = '';
    this.searchOpen = false;
  };

  private onFilterInput = (ev: InputEvent) => {
    this.filterText = (ev.target as HTMLInputElement).value;
  };

  private onFilterKeyDown = (ev: KeyboardEvent) => {
    if (ev.key === 'Escape') {
      this.closeSearch();
    } else if (ev.key === 'Enter') {
      (ev.target as HTMLInputElement).blur(); // hide the on-screen keyboard
    }
  };

  private clearFilter = async () => {
    this.filterText = '';
    await this.updateComplete;
    this.filterInput?.focus();
  };

  protected updated(changed: PropertyValues) {
    if (changed.has('navigateIds') && this.crumbs) {
      this.crumbs.scrollLeft = this.crumbs.scrollWidth;
    }
  }

  render() {
    const config = this.store.config.mediaBrowser ?? {};
    return html`
      ${this.playAllLoading ? html`<div class="loading-overlay"><div class="loading-spinner"></div></div>` : nothing}
      ${this.playAllWarning ? html`<div class="play-all-warning">${this.playAllWarning}</div>` : nothing} ${config.hideHeader ? nothing : this.renderHeader()}
      <div class="browse-wrap" @touchstart=${this.onTouchStart} @touchmove=${this.onTouchMove} @touchend=${this.onTouchEnd} @touchcancel=${this.onTouchEnd}>
        ${
          this.navigateIds.length > 1
            ? html`<div class="swipe-hint" style="opacity:${Math.min(1, this.swipeOffset / SWIPE_BACK_DISTANCE)}">
                <ha-svg-icon .path=${mdiArrowLeft}></ha-svg-icon>
              </div>`
            : nothing
        }
        ${keyed(
          this.layout,
          html`<sonos-ha-media-player-browse
            style=${this.swipeOffset ? `transform:translateX(${this.swipeOffset * 0.6}px)` : ''}
            class=${classMap({ swiping: this.swipeOffset > 0 })}
            .hass=${this.store.hass}
            .entityId=${this.store.activePlayer.id}
            .navigateIds=${this.navigateIds}
            .preferredLayout=${this.layout}
            .itemsPerRow=${config.itemsPerRow}
            .showOnlyItems=${config.showOnlyItems}
            .hideItems=${config.hideItems}
            .filterText=${this.filterText}
            .alphaIndex=${config.alphabetIndex ?? true}
            .action=${'play'}
            @media-picked=${this.onMediaPicked}
            @media-browsed=${this.onMediaBrowsed}
            @displayed-changed=${this.onDisplayedChanged}
          ></sonos-ha-media-player-browse>`,
        )}
        ${
          this.filterText && this.displayedCount === 0
            ? html`<div class="no-results">
                <ha-svg-icon .path=${mdiMagnify}></ha-svg-icon>
                <span>${this.t('noResults', { text: this.filterText })}</span>
              </div>`
            : nothing
        }
      </div>
      ${this.menuOpen ? this.renderMenu() : nothing} ${this.toast ? html`<div class="toast" role="status">${this.toast}</div>` : nothing}
    `;
  }

  private renderHeader() {
    const config = this.store.config.mediaBrowser ?? {};
    return html`
      <div class="nav-header">
        ${this.searchOpen ? this.renderSearchRow() : this.renderTitleRow(config.shortcut, config.hideActivePlayerName ?? false)}
        ${this.navigateIds.length > 1 ? this.renderCrumbs() : nothing}
      </div>
    `;
  }

  private renderTitleRow(shortcut: MediaBrowserShortcut | undefined, hideActivePlayerName: boolean) {
    const playerName = getSpeakerList(this.store.activePlayer, this.store.predefinedGroups);
    const canGoBack = this.navigateIds.length > 1;
    return html`
      <div class="row">
        ${
          canGoBack
            ? html`<sonos-icon-button class="back" .path=${mdiArrowLeft} @click=${this.goBack} title=${this.t('back')}></sonos-icon-button>`
            : html`<div class="spacer"></div>`
        }
        <div class="title-section">
          <span class="title">${this.currentTitle || this.t('mediaBrowser')}</span>
          <span class="player-name" ?hidden=${hideActivePlayerName}>${playerName}</span>
        </div>
        ${renderShortcutButton(shortcut, () => this.navigateToShortcut(shortcut!), this.isShortcutActive(shortcut))}
        <sonos-icon-button .path=${mdiMagnify} @click=${this.openSearch} title=${this.t('filter')}></sonos-icon-button>
        <sonos-icon-button .path=${mdiStar} @click=${this.goToFavorites} title=${this.t('favorites')}></sonos-icon-button>
        <sonos-icon-button
          class=${classMap({ 'menu-open': this.menuOpen })}
          .path=${mdiDotsVertical}
          @click=${() => {
            this.menuOpen = !this.menuOpen;
            this.confirmPlayAll = false;
          }}
          title=${this.t('menu')}
        ></sonos-icon-button>
      </div>
    `;
  }

  private renderSearchRow() {
    return html`
      <div class="row search-row">
        <sonos-icon-button .path=${mdiArrowLeft} @click=${this.closeSearch} title=${this.t('closeFilter')}></sonos-icon-button>
        <label class="filter-field">
          <ha-svg-icon .path=${mdiMagnify}></ha-svg-icon>
          <input
            class="filter-input"
            type="search"
            enterkeyhint="search"
            autocomplete="off"
            autocorrect="off"
            spellcheck="false"
            .value=${this.filterText}
            placeholder=${this.t('filterPlaceholder', { title: this.currentTitle || this.t('library') })}
            @input=${this.onFilterInput}
            @keydown=${this.onFilterKeyDown}
          />
          ${
            this.filterText
              ? html`<button class="clear" @click=${this.clearFilter} title=${this.t('clear')}>
                  <ha-svg-icon .path=${mdiClose}></ha-svg-icon>
                </button>`
              : nothing
          }
        </label>
        ${this.filterText ? html`<span class="count">${this.displayedCount}</span>` : nothing}
      </div>
    `;
  }

  private renderCrumbs() {
    const last = this.navigateIds.length - 1;
    return html`
      <nav class="crumbs">
        ${this.navigateIds.map((id, level) => {
          const label = level === 0 ? this.t('library') : id.title || '…';
          return html`
            ${level > 0 ? html`<ha-svg-icon class="sep" .path=${mdiChevronRight}></ha-svg-icon>` : nothing}
            <button class="crumb ${classMap({ current: level === last })}" ?disabled=${level === last} @click=${() => this.goToLevel(level)}>
              ${level === 0 ? html`<ha-svg-icon .path=${mdiHome}></ha-svg-icon>` : nothing}<span>${label}</span>
            </button>
          `;
        })}
      </nav>
    `;
  }

  private renderMenu() {
    const playable = this.mediaBrowser?.getPlayableChildren().length ?? 0;
    const rows: MenuRow[] = [];
    if (playable > 0) {
      rows.push({
        icon: mdiPlay,
        label: playable > 1 ? this.t('playAllCount', { count: playable }) : this.t('playAll'),
        accent: true,
        onClick: () => {
          if (playable > PLAY_ALL_CONFIRM_THRESHOLD) {
            this.confirmPlayAll = true;
          } else {
            this.menuOpen = false;
            this.handlePlayAll();
          }
        },
      });
    }
    rows.push({ icon: mdiStar, label: this.t('favorites'), onClick: this.goToFavorites });
    rows.push({
      icon: this.isCurrentPathStart ? mdiFolderStar : mdiFolderStarOutline,
      label: this.t('setStart'),
      checked: this.isCurrentPathStart,
      onClick: this.toggleStartPath,
    });
    const footer = this.confirmPlayAll
      ? html`<div class="menu-confirm">
          ${this.t('playAllConfirm', { count: playable })}
          <div class="menu-confirm-actions">
            <button @click=${() => (this.confirmPlayAll = false)}>${this.t('cancel')}</button>
            <button
              class="primary"
              @click=${() => {
                this.confirmPlayAll = false;
                this.menuOpen = false;
                this.handlePlayAll();
              }}
            >
              ${this.t('play')}
            </button>
          </div>
        </div>`
      : nothing;
    const tapActions: { value: TapAction; icon: string; label: BrowserStringKey }[] = [
      { value: 'replace', icon: mdiPlayBoxMultiple, label: 'tapReplace' },
      { value: 'next', icon: mdiSkipNext, label: 'tapNext' },
      { value: 'add', icon: mdiPlaylistPlus, label: 'tapAdd' },
    ];
    const extra = html`
      <div class="menu-label" style="margin-top:14px">${this.t('tapAction')}</div>
      <div class="segmented" role="radiogroup">
        ${tapActions.map(
          (a) =>
            html`<button
              role="radio"
              aria-checked=${this.tapAction === a.value}
              class=${classMap({ selected: this.tapAction === a.value })}
              @click=${() => {
                this.tapAction = a.value;
                setTapAction(a.value);
              }}
            >
              <ha-svg-icon .path=${a.icon}></ha-svg-icon><span>${this.t(a.label)}</span>
            </button>`,
        )}
      </div>
      <div class="menu-hint">${this.t('longPressHint')}</div>
    `;
    return renderMenuPanel({
      extra,
      hass: this.store.hass,
      layout: this.layout as LayoutType,
      onLayout: (layout) => {
        this.menuOpen = false;
        this.dispatchEvent(new CustomEvent('layout-change', { detail: layout }));
      },
      rows,
      onClose: () => (this.menuOpen = false),
      footer,
    });
  }

  // ---------- swipe right to go back ----------

  private onTouchStart = (ev: TouchEvent) => {
    if (this.navigateIds.length <= 1 || ev.touches.length !== 1) {
      this.swipe = undefined;
      return;
    }
    const path = ev.composedPath();
    if (path.some((el) => (el as HTMLElement).tagName === 'SONOS-ALPHA-RAIL')) {
      this.swipe = undefined;
      return;
    }
    this.swipe = { x: ev.touches[0].clientX, y: ev.touches[0].clientY };
  };

  private onTouchMove = (ev: TouchEvent) => {
    if (!this.swipe) {
      return;
    }
    const dx = ev.touches[0].clientX - this.swipe.x;
    const dy = ev.touches[0].clientY - this.swipe.y;
    if (this.swipe.tracking === undefined) {
      if (Math.abs(dx) < 12 && Math.abs(dy) < 12) {
        return;
      }
      // only a clearly horizontal swipe to the right, so vertical scrolling is never disturbed
      this.swipe.tracking = dx > 0 && Math.abs(dx) > Math.abs(dy) * 1.6;
    }
    if (this.swipe.tracking) {
      this.swipeOffset = Math.max(0, Math.min(dx, SWIPE_BACK_DISTANCE * 1.6));
    }
  };

  private onTouchEnd = () => {
    const trigger = this.swipe?.tracking && this.swipeOffset >= SWIPE_BACK_DISTANCE;
    this.swipe = undefined;
    this.swipeOffset = 0;
    if (trigger) {
      navigator.vibrate?.(8);
      this.goBack();
    }
  };

  private isShortcutActive(shortcut: MediaBrowserShortcut | undefined): boolean {
    return !!shortcut && this.navigateIds.some((nav) => nav.media_content_id === shortcut.media_content_id);
  }

  private async handlePlayAll() {
    const children = this.mediaBrowser?.getPlayableChildren() || [];
    if (!children.length) {
      return;
    }
    this.playAllWarning = '';
    this.playAllLoading = true;
    try {
      const firstItem = await playAll(this.store, children);
      if (firstItem) {
        this.dispatchEvent(customEvent(MEDIA_ITEM_SELECTED, firstItem));
      }
      if (children.length > 1) {
        let lastCount = 0;
        for (let attempt = 0; attempt < 4; attempt++) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
          const queue = await this.store.hassService.getQueue(this.store.activePlayer, true);
          if (queue.length >= children.length) {
            break;
          }
          if (queue.length <= lastCount) {
            // Queue stopped growing — queueing likely not supported
            this.playAllWarning = `Only ${queue.length} of ${children.length} items were added to the queue. Some media types do not support queueing.`;
            setTimeout(() => (this.playAllWarning = ''), 8000);
            break;
          }
          lastCount = queue.length;
        }
      }
    } catch (e) {
      console.error('Failed to play all:', e);
    } finally {
      this.playAllLoading = false;
    }
  }

  private onMediaPicked = async (event: CustomEvent) => {
    const mediaItem = event.detail.item as MediaPlayerItem;
    const tapAction = getTapAction();
    if (tapAction === 'replace') {
      await this.store.mediaControlService.playMedia(this.store.activePlayer, mediaItem);
      this.dispatchEvent(customEvent(MEDIA_ITEM_SELECTED, mediaItem));
      return;
    }
    try {
      await this.store.mediaControlService.playMedia(this.store.activePlayer, mediaItem, tapAction);
      this.showToast(this.t(tapAction === 'next' ? 'toastNext' : 'toastAdd', { title: mediaItem.title ?? '' }));
    } catch (e) {
      console.error(e);
      this.showToast(this.t('toastError'));
    }
  };

  private showToast(text: string) {
    this.toast = text;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => (this.toast = ''), 2800);
  }

  private onMediaBrowsed = (event: CustomEvent) => {
    const ids = event.detail.ids as NavigateId[];
    const lastItem = ids[ids.length - 1];
    this.setNavigateIds(ids, lastItem?.title || event.detail.current?.title || '');
    this.mediaLoaded = !this.mediaLoaded;
  };

  private onDisplayedChanged = (event: CustomEvent<{ count: number }>) => {
    this.displayedCount = event.detail.count;
  };

  static get styles() {
    return [
      mediaBrowserStyles,
      menuStyles,
      navHeaderStyles,
      css`
        :host {
          position: relative;
        }
        sonos-icon-button.menu-open {
          color: var(--accent-color);
        }
        .crumbs {
          /* the chips scroll sideways; never let them widen the card */
          contain: inline-size;
          display: flex;
          align-items: center;
          gap: 2px;
          padding: 0 12px 8px;
          overflow-x: auto;
          scrollbar-width: none;
          white-space: nowrap;
          -webkit-overflow-scrolling: touch;
        }
        .crumbs::-webkit-scrollbar {
          display: none;
        }
        .crumb {
          flex: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          max-width: 220px;
          height: 36px;
          padding: 0 14px;
          border-radius: 18px;
          border: 1px solid var(--divider-color);
          background: rgba(127, 127, 127, 0.08);
          color: var(--primary-text-color);
          font: inherit;
          font-size: calc(var(--sonos-font-size, 1rem) * 0.85);
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }
        .crumb span {
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .crumb ha-svg-icon {
          --mdc-icon-size: 18px;
          color: var(--secondary-text-color);
        }
        .crumb:active:not([disabled]) {
          background: rgba(127, 127, 127, 0.22);
        }
        .crumb.current {
          cursor: default;
          border-color: transparent;
          background: rgba(var(--rgb-accent-color, 255, 152, 0), 0.16);
          color: var(--accent-color, var(--primary-color));
          font-weight: 600;
          opacity: 1;
        }
        .crumbs .sep {
          flex: none;
          --mdc-icon-size: 16px;
          color: var(--secondary-text-color);
          opacity: 0.6;
        }
        .search-row {
          gap: 4px;
          padding-right: 12px;
        }
        .filter-field {
          flex: 1;
          min-width: 0;
          contain: inline-size;
          display: flex;
          align-items: center;
          gap: 8px;
          height: 44px;
          padding: 0 6px 0 14px;
          border-radius: 22px;
          background: rgba(127, 127, 127, 0.14);
          box-shadow: 0 0 0 2px transparent;
          transition: box-shadow 0.15s;
        }
        .filter-field:focus-within {
          box-shadow: 0 0 0 2px var(--accent-color, var(--primary-color));
        }
        .filter-field > ha-svg-icon {
          --mdc-icon-size: 22px;
          color: var(--secondary-text-color);
          flex: none;
        }
        .filter-input {
          flex: 1;
          min-width: 0;
          width: 0;
          height: 100%;
          border: none;
          outline: none;
          background: none;
          color: var(--primary-text-color);
          font: inherit;
          font-size: 16px; /* 16px avoids the iOS zoom-on-focus */
        }
        .filter-input::-webkit-search-cancel-button {
          display: none;
        }
        .clear {
          flex: none;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: none;
          background: none;
          color: var(--secondary-text-color);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .clear ha-svg-icon {
          --mdc-icon-size: 20px;
        }
        .count {
          flex: none;
          min-width: 28px;
          padding: 0 8px;
          height: 28px;
          line-height: 28px;
          border-radius: 14px;
          text-align: center;
          font-size: 0.8rem;
          font-weight: 600;
          background: var(--accent-color, var(--primary-color));
          color: var(--text-primary-color, #fff);
        }
        .browse-wrap {
          position: relative;
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .browse-wrap sonos-ha-media-player-browse {
          transition: transform 0.2s ease-out;
        }
        .browse-wrap sonos-ha-media-player-browse.swiping {
          transition: none;
        }
        .swipe-hint {
          position: absolute;
          left: 10px;
          top: 50%;
          z-index: 5;
          width: 44px;
          height: 44px;
          margin-top: -22px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--accent-color, var(--primary-color));
          color: var(--text-primary-color, #fff);
          pointer-events: none;
          transition: opacity 0.15s;
        }
        .toast {
          position: absolute;
          left: 50%;
          bottom: 20px;
          transform: translateX(-50%);
          z-index: 40;
          max-width: calc(100% - 32px);
          padding: 12px 20px;
          border-radius: 24px;
          background: rgba(20, 20, 20, 0.92);
          color: #fff;
          font-size: 0.95rem;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          pointer-events: none;
        }
        .no-results {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 24px;
          text-align: center;
          color: var(--secondary-text-color);
          pointer-events: none;
        }
        .no-results ha-svg-icon {
          --mdc-icon-size: 48px;
          opacity: 0.5;
        }
      `,
    ];
  }
}
