import { css, html, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';
import { mdiAccount, mdiCheckboxMultipleMarkedOutline, mdiDotsVertical, mdiMusic, mdiPlaylistMusic } from '@mdi/js';
import { customEvent } from '../../utils/utils';
import '../../components/selection-actions';
import './search-filter-menu';
import { LibraryFilter, SearchFilterAction, SearchHeaderAction, SearchMediaType } from './search.types';
import { OperationProgress } from '../../types';

export class SearchHeader extends LitElement {
  @property() title = 'Search';
  @property({ attribute: false }) mediaTypes!: Set<SearchMediaType>;
  @property({ type: Boolean }) selectMode = false;
  @property({ type: Boolean }) hasSelection = false;
  @property({ attribute: false }) operationProgress: OperationProgress | null = null;
  @property() libraryFilter: LibraryFilter = 'all';
  @state() private filterMenuOpen = false;

  render() {
    return html`
      <div class="header">
        <div class="title-container">
          <span class="title">${this.title}</span>
        </div>
        <div class="header-icons">
          <div class="media-type-icons" ?hidden=${this.selectMode}>
            <ha-icon-button
              .path=${mdiMusic}
              @click=${() => this.dispatch({ type: 'toggle-media-type', mediaType: 'track' })}
              ?selected=${this.mediaTypes.has('track')}
              title="Search Tracks"
            ></ha-icon-button>
            <ha-icon-button
              .path=${mdiAccount}
              @click=${() => this.dispatch({ type: 'toggle-media-type', mediaType: 'artist' })}
              ?selected=${this.mediaTypes.has('artist')}
              title="Search Artists"
            ></ha-icon-button>
            <ha-icon-button
              .path=${mdiPlaylistMusic}
              @click=${() => this.dispatch({ type: 'toggle-media-type', mediaType: 'playlist' })}
              ?selected=${this.mediaTypes.has('playlist')}
              title="Search Playlists"
            ></ha-icon-button>
            <div class="separator"></div>
            <div class="filter-menu-anchor">
              <ha-icon-button
                .path=${mdiDotsVertical}
                @click=${() => (this.filterMenuOpen = !this.filterMenuOpen)}
                title="More filters"
                ?selected=${this.mediaTypes.has('album') || this.mediaTypes.has('radio') || this.libraryFilter !== 'all'}
              ></ha-icon-button>
              <sonos-search-filter-menu
                ?hidden=${!this.filterMenuOpen}
                .mediaTypes=${this.mediaTypes}
                .libraryFilter=${this.libraryFilter}
                @filter-action=${this.handleFilterAction}
              ></sonos-search-filter-menu>
            </div>
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
      [hidden] {
        display: none !important;
      }
      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 0.25rem;
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
