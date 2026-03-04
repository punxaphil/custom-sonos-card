import { css, html, LitElement, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { mdiBookshelf, mdiCheck } from '@mdi/js';
import { customEvent } from '../../utils/utils';
import { HeaderIcon, LibraryFilter, SearchFilterAction, SearchMediaType } from './search.types';

const LIBRARY_LABELS: Record<LibraryFilter, string> = {
  all: 'All',
  library: 'Library only',
  'non-library': 'Non-library only',
};

export class SearchFilterMenu extends LitElement {
  @property({ attribute: false }) overflowIcons: HeaderIcon[] = [];
  @property({ attribute: false }) mediaTypes!: Set<SearchMediaType>;
  @property() libraryFilter: LibraryFilter = 'all';

  render() {
    const mediaTypeOverflows = this.overflowIcons.filter((i) => i.type !== 'library-filter');
    const hasLibraryFilter = this.overflowIcons.some((i) => i.type === 'library-filter');

    return html`
      <div class="filter-menu" @click=${(e: Event) => e.stopPropagation()}>
        ${mediaTypeOverflows.map(
          (icon) => html`
            <div class="filter-menu-item" @click=${() => this.dispatch({ type: 'toggle-media-type', mediaType: icon.type as SearchMediaType })}>
              <ha-svg-icon .path=${icon.icon}></ha-svg-icon>
              <span>${icon.title}</span>
              <ha-svg-icon class="check" .path=${mdiCheck} ?hidden=${!this.mediaTypes.has(icon.type as SearchMediaType)}></ha-svg-icon>
            </div>
          `,
        )}
        ${hasLibraryFilter
          ? html`
              ${mediaTypeOverflows.length > 0 ? html`<div class="filter-menu-divider"></div>` : nothing}
              <div class="filter-menu-item" @click=${() => this.dispatch({ type: 'toggle-library-filter' })}>
                <ha-svg-icon .path=${mdiBookshelf}></ha-svg-icon>
                <span>${LIBRARY_LABELS[this.libraryFilter]}</span>
                <ha-svg-icon class="check" .path=${mdiCheck} ?hidden=${this.libraryFilter === 'all'}></ha-svg-icon>
              </div>
            `
          : nothing}
        <div class="filter-menu-divider"></div>
        <div class="filter-menu-done" @click=${() => this.dispatch({ type: 'close' })}>Done</div>
      </div>
    `;
  }

  private dispatch(action: SearchFilterAction) {
    this.dispatchEvent(customEvent('filter-action', action));
  }

  static get styles() {
    return css`
      [hidden] {
        display: none !important;
      }
      .filter-menu {
        position: absolute;
        top: 100%;
        right: 0;
        z-index: 10;
        background: var(--card-background-color, var(--primary-background-color));
        border: 1px solid var(--divider-color, rgba(255, 255, 255, 0.12));
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        min-width: 180px;
        padding: 4px 0;
      }
      .filter-menu-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 16px;
        cursor: pointer;
        color: var(--primary-text-color);
        font-size: 0.9rem;
      }
      .filter-menu-item:hover {
        background: var(--secondary-background-color);
      }
      .filter-menu-item ha-svg-icon {
        --mdc-icon-size: 20px;
        flex-shrink: 0;
      }
      .filter-menu-item span {
        flex: 1;
      }
      .filter-menu-item .check {
        --mdc-icon-size: 18px;
        color: var(--accent-color);
      }
      .filter-menu-divider {
        height: 1px;
        background: var(--divider-color, rgba(255, 255, 255, 0.12));
        margin: 4px 0;
      }
      .filter-menu-done {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 8px 16px;
        cursor: pointer;
        color: var(--accent-color);
        font-size: 0.9rem;
        font-weight: 500;
      }
      .filter-menu-done:hover {
        background: var(--secondary-background-color);
      }
    `;
  }
}

customElements.define('sonos-search-filter-menu', SearchFilterMenu);
