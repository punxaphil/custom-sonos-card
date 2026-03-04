import { css, html, LitElement, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { mdiAccount, mdiAlbum, mdiBookshelf, mdiCheckboxMultipleMarkedOutline, mdiDotsVertical, mdiMusic, mdiPlaylistMusic, mdiRadio } from '@mdi/js';
import { customEvent } from '../../utils/utils';
import '../../components/selection-actions';
import './search-filter-menu';
import { HeaderIcon, LibraryFilter, SearchFilterAction, SearchHeaderAction, SearchMediaType } from './search.types';
import { OperationProgress } from '../../types';

const ALL_HEADER_ICONS: HeaderIcon[] = [
  { type: 'track', icon: mdiMusic, title: 'Tracks' },
  { type: 'artist', icon: mdiAccount, title: 'Artists' },
  { type: 'playlist', icon: mdiPlaylistMusic, title: 'Playlists' },
  { type: 'album', icon: mdiAlbum, title: 'Albums' },
  { type: 'radio', icon: mdiRadio, title: 'Radio' },
  { type: 'library-filter', icon: mdiBookshelf, title: 'Library filter' },
];

const ICON_BUTTON_WIDTH = 48;

const LIBRARY_LABELS: Record<LibraryFilter, string> = {
  all: 'All sources',
  library: 'Library only',
  'non-library': 'Non-library only',
};

export class SearchHeader extends LitElement {
  @property() title = 'Search';
  @property({ attribute: false }) mediaTypes!: Set<SearchMediaType>;
  @property({ type: Boolean }) selectMode = false;
  @property({ type: Boolean }) hasSelection = false;
  @property({ attribute: false }) operationProgress: OperationProgress | null = null;
  @property() libraryFilter: LibraryFilter = 'all';
  @state() private filterMenuOpen = false;
  @state() private visibleCount = ALL_HEADER_ICONS.length;

  private resizeObserver?: ResizeObserver;

  firstUpdated() {
    this.resizeObserver = new ResizeObserver(() => this.calculateVisibleCount());
    this.resizeObserver.observe(this);
    requestAnimationFrame(() => this.calculateVisibleCount());
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.resizeObserver?.disconnect();
  }

  private calculateVisibleCount() {
    const hostWidth = this.clientWidth;
    if (!hostWidth) {
      return;
    }

    const headerPadding = 16; // 0.5rem * 2
    const titleMinWidth = 60;
    const selectBtnWidth = ICON_BUTTON_WIDTH;
    const total = ALL_HEADER_ICONS.length;

    // Try fitting all icons without dots button
    const availableWithoutDots = hostWidth - headerPadding - titleMinWidth - selectBtnWidth;
    if (availableWithoutDots >= total * ICON_BUTTON_WIDTH) {
      if (this.visibleCount !== total) {
        this.visibleCount = total;
      }
      return;
    }

    // Need dots button — account for separator + dots
    const dotsAndSep = ICON_BUTTON_WIDTH + 9;
    const available = hostWidth - headerPadding - titleMinWidth - selectBtnWidth - dotsAndSep;
    const count = Math.max(0, Math.min(total, Math.floor(available / ICON_BUTTON_WIDTH)));
    if (this.visibleCount !== count) {
      this.visibleCount = count;
    }
  }

  private get visibleIcons(): HeaderIcon[] {
    return ALL_HEADER_ICONS.slice(0, this.visibleCount);
  }

  private get overflowIcons(): HeaderIcon[] {
    return ALL_HEADER_ICONS.slice(this.visibleCount);
  }

  private isIconActive(icon: HeaderIcon): boolean {
    if (icon.type === 'library-filter') {
      return this.libraryFilter !== 'all';
    }
    return this.mediaTypes.has(icon.type);
  }

  private onIconClick(icon: HeaderIcon) {
    if (icon.type === 'library-filter') {
      this.dispatch({ type: 'toggle-library-filter' });
    } else {
      this.dispatch({ type: 'toggle-media-type', mediaType: icon.type });
    }
  }

  private getIconTitle(icon: HeaderIcon): string {
    if (icon.type === 'library-filter') {
      return LIBRARY_LABELS[this.libraryFilter];
    }
    return `Search ${icon.title}`;
  }

  render() {
    const hasOverflow = this.overflowIcons.length > 0;

    return html`
      <div class="header">
        <div class="title-container">
          <span class="title">${this.title}</span>
        </div>
        <div class="header-icons">
          <div class="media-type-icons" ?hidden=${this.selectMode}>
            ${this.visibleIcons.map(
              (icon) => html`
                <ha-icon-button
                  .path=${icon.icon}
                  @click=${() => this.onIconClick(icon)}
                  ?selected=${this.isIconActive(icon)}
                  title=${this.getIconTitle(icon)}
                ></ha-icon-button>
              `,
            )}
            ${hasOverflow
              ? html`
                  <div class="separator" ?hidden=${this.visibleCount === 0}></div>
                  <div class="filter-menu-anchor">
                    <ha-icon-button
                      .path=${mdiDotsVertical}
                      @click=${() => (this.filterMenuOpen = !this.filterMenuOpen)}
                      title="More filters"
                      ?selected=${this.overflowIcons.some((i) => this.isIconActive(i))}
                    ></ha-icon-button>
                    <sonos-search-filter-menu
                      ?hidden=${!this.filterMenuOpen}
                      .overflowIcons=${this.overflowIcons}
                      .mediaTypes=${this.mediaTypes}
                      .libraryFilter=${this.libraryFilter}
                      @filter-action=${this.handleFilterAction}
                    ></sonos-search-filter-menu>
                  </div>
                `
              : nothing}
          </div>
          <sonos-selection-actions
            ?hidden=${!this.selectMode}
            .hasSelection=${this.hasSelection}
            .disabled=${this.operationProgress !== null}
            .showInvert=${this.hasSelection}
            @invert-selection=${() => this.dispatch({ type: 'invert-selection' })}
            @play-selected=${(e: CustomEvent) => this.dispatch({ type: 'selection-action', action: e.detail })}
            @queue-selected=${(e: CustomEvent) => this.dispatch({ type: 'selection-action', action: e.detail })}
            @queue-selected-at-end=${(e: CustomEvent) => this.dispatch({ type: 'selection-action', action: e.detail })}
          ></sonos-selection-actions>
          <ha-icon-button
            .path=${mdiCheckboxMultipleMarkedOutline}
            @click=${() => this.dispatch({ type: 'toggle-select-mode' })}
            ?selected=${this.selectMode}
            title="Select mode"
          ></ha-icon-button>
        </div>
      </div>
    `;
  }

  private handleFilterAction(e: CustomEvent<SearchFilterAction>) {
    const action = e.detail;
    if (action.type === 'close') {
      this.filterMenuOpen = false;
      return;
    }
    this.dispatch(action);
  }

  private dispatch(action: SearchHeaderAction) {
    this.dispatchEvent(customEvent('header-action', action));
  }

  static get styles() {
    return css`
      :host {
        display: block;
        flex-shrink: 0;
      }
      [hidden] {
        display: none !important;
      }
      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.5rem;
      }
      .title-container {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        min-width: 0;
        padding: 0.5rem;
      }
      .title {
        font-size: calc(var(--sonos-font-size, 1rem) * 1.2);
        font-weight: bold;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .header-icons {
        display: flex;
        align-items: center;
      }
      .media-type-icons {
        display: flex;
        gap: 0;
        align-items: center;
      }
      .media-type-icons ha-icon-button[selected] {
        color: var(--accent-color);
      }
      .separator {
        width: 1px;
        height: 24px;
        background: var(--divider-color, rgba(255, 255, 255, 0.12));
        margin: 0 4px;
      }
      .filter-menu-anchor {
        position: relative;
        display: inline-flex;
      }
      .filter-menu-anchor ha-icon-button[selected] {
        color: var(--accent-color);
      }
    `;
  }
}

customElements.define('sonos-search-header', SearchHeader);
