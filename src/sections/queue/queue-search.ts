import { html, LitElement, nothing, PropertyValues } from 'lit';
import { property, state, query } from 'lit/decorators.js';
import { mdiMagnify, mdiChevronUp, mdiChevronDown, mdiCheckAll, mdiEyeCheck, mdiClose } from '@mdi/js';
import { QueueSearchMatch } from '../../types';
import { queueSearchStyles } from './queue-search.styles';

export class QueueSearch extends LitElement {
  @property({ attribute: false }) items: { title: string }[] = [];
  @property({ type: Boolean }) selectMode = false;
  @state() expanded = false;
  @state() private searchText = '';
  @state() private matchIndices: number[] = [];
  @state() private currentMatchIndex = 0;
  @state() private lastHighlightedIndex = -1;
  @state() private showOnlyMatches = false;
  @state() private shownIndices: number[] = [];
  @query('input') private input?: HTMLInputElement;
  private readonly LOCAL_STORAGE_KEY = 'sonos-queue-search-state';
  private needsStateRestoration = false;

  connectedCallback(): void {
    super.connectedCallback();
    const saved = localStorage.getItem(this.LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const state = JSON.parse(saved);
        this.expanded = !!state.expanded;
        this.searchText = state.searchText || '';
        this.showOnlyMatches = !!state.showOnlyMatches;
        this.needsStateRestoration = true;
      } catch {
        // Ignore parse errors
      }
    }
  }

  private saveStateToLocalStorage() {
    const state = {
      expanded: this.expanded,
      searchText: this.searchText,
      showOnlyMatches: this.showOnlyMatches,
    };
    localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(state));
  }
  protected willUpdate(changedProperties: PropertyValues): void {
    if (changedProperties.has('items') && this.searchText && !this.needsStateRestoration) {
      this.findMatches(false);
      if (this.showOnlyMatches) {
        this.updateShownIndices();
        // Notify parent of updated shownIndices when items change
        this.dispatchEvent(
          new CustomEvent('queue-search-show-only-matches', {
            detail: { showOnlyMatches: this.showOnlyMatches, shownIndices: this.shownIndices },
          }),
        );
      }
    }
  }

  protected updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);

    // Restore state and notify parent after initial render with items
    if (this.needsStateRestoration && changedProperties.has('items')) {
      this.needsStateRestoration = false;

      // Recalculate matches if we have search text
      if (this.searchText) {
        this.findMatches(false);
        if (this.showOnlyMatches) {
          this.updateShownIndices();
        }
      }

      // Always notify parent about current state to ensure sync
      this.dispatchEvent(new CustomEvent('queue-search-expanded', { detail: { expanded: this.expanded } }));
      this.dispatchEvent(
        new CustomEvent('queue-search-show-only-matches', {
          detail: { showOnlyMatches: this.showOnlyMatches, shownIndices: this.shownIndices },
        }),
      );
    }
  }

  render() {
    const hasNoMatch = this.searchText.length > 0 && this.matchIndices.length === 0;
    return html`
      <ha-icon-button .path=${mdiMagnify} @click=${this.toggleSearch} ?selected=${this.expanded}></ha-icon-button>
      ${this.expanded ? this.renderSearchBar(hasNoMatch) : nothing}
    `;
  }

  private renderSearchBar(hasNoMatch: boolean) {
    const hasText = this.searchText.length > 0;
    return html`
      <div class="search-row">
        <input
          type="text"
          placeholder="Search queue..."
          class=${hasNoMatch ? 'no-match' : ''}
          .value=${this.searchText}
          @input=${this.onSearchInput}
          @keydown=${this.onKeyDown}
        />
        ${this.matchIndices.length > 0 ? this.renderMatchInfo() : nothing}
        ${hasText
          ? html`<ha-icon-button
              .path=${mdiEyeCheck}
              @click=${this.toggleShowOnlyMatches}
              ?selected=${this.showOnlyMatches}
              title="Show only matches"
            ></ha-icon-button>`
          : nothing}
        ${hasText ? html`<ha-icon-button .path=${mdiClose} @click=${this.clearSearchText} title="Clear search"></ha-icon-button>` : nothing}
      </div>
    `;
  }

  private renderMatchInfo() {
    return html`
      <span class="match-info">${this.currentMatchIndex + 1}/${this.matchIndices.length}</span>
      <ha-icon-button .path=${mdiChevronUp} @click=${this.previousMatch}></ha-icon-button>
      <ha-icon-button .path=${mdiChevronDown} @click=${this.nextMatch}></ha-icon-button>
      ${this.selectMode ? html`<ha-icon-button .path=${mdiCheckAll} @click=${this.selectAllMatches} title="Select all matches"></ha-icon-button>` : nothing}
    `;
  }

  private toggleSearch() {
    this.expanded = !this.expanded;

    // Auto-disable eye-check when hiding search bar
    if (!this.expanded && this.showOnlyMatches) {
      this.showOnlyMatches = false;
      this.shownIndices = [];
      this.dispatchEvent(
        new CustomEvent('queue-search-show-only-matches', {
          detail: { showOnlyMatches: false, shownIndices: [] },
        }),
      );
    }

    this.saveStateToLocalStorage();
    if (this.expanded) {
      this.updateComplete.then(() => this.input?.focus());
    }
    this.dispatchEvent(new CustomEvent('queue-search-expanded', { detail: { expanded: this.expanded } }));
  }

  private onSearchInput(e: Event) {
    const newText = (e.target as HTMLInputElement).value;
    const wasExtendingSearch = newText.startsWith(this.searchText) && this.searchText.length > 0;
    this.searchText = newText;
    this.saveStateToLocalStorage();
    this.findMatches(wasExtendingSearch);
    if (this.showOnlyMatches) {
      this.updateShownIndices();
      // Notify parent of updated shownIndices when value changes and eyecheck is enabled
      this.dispatchEvent(
        new CustomEvent('queue-search-show-only-matches', {
          detail: { showOnlyMatches: this.showOnlyMatches, shownIndices: this.shownIndices },
        }),
      );
    }
  }
  private toggleShowOnlyMatches = () => {
    this.showOnlyMatches = !this.showOnlyMatches;
    this.saveStateToLocalStorage();
    if (this.showOnlyMatches) {
      this.updateShownIndices();
    } else {
      this.shownIndices = [];
    }
    this.dispatchEvent(
      new CustomEvent('queue-search-show-only-matches', {
        detail: { showOnlyMatches: this.showOnlyMatches, shownIndices: this.shownIndices },
      }),
    );
  };

  private updateShownIndices() {
    this.shownIndices = this.matchIndices.slice();
  }

  private findMatches(continueFromCurrent: boolean) {
    if (!this.searchText) {
      this.matchIndices = [];
      this.lastHighlightedIndex = -1;
      this.dispatchMatchEvent(-1);
      if (this.showOnlyMatches) {
        this.updateShownIndices();
      }
      return;
    }

    const searchLower = this.searchText.toLowerCase();
    this.matchIndices = this.items.map((item, i) => (item.title?.toLowerCase().includes(searchLower) ? i : -1)).filter((i) => i !== -1);

    if (this.matchIndices.length === 0) {
      this.lastHighlightedIndex = -1;
      this.dispatchMatchEvent(-1);
      if (this.showOnlyMatches) {
        this.updateShownIndices();
      }
      return;
    }

    if (continueFromCurrent && this.lastHighlightedIndex >= 0) {
      const nextMatchAfterLast = this.matchIndices.find((i) => i >= this.lastHighlightedIndex);
      this.currentMatchIndex = nextMatchAfterLast !== undefined ? this.matchIndices.indexOf(nextMatchAfterLast) : 0;
    } else {
      this.currentMatchIndex = 0;
    }

    this.highlightCurrentMatch();
    if (this.showOnlyMatches) {
      this.updateShownIndices();
    }
  }

  private highlightCurrentMatch() {
    if (this.matchIndices.length === 0) {
      return;
    }
    const matchIndex = this.matchIndices[this.currentMatchIndex];
    this.lastHighlightedIndex = matchIndex;
    this.dispatchMatchEvent(matchIndex);
  }

  private dispatchMatchEvent(index: number) {
    this.dispatchEvent(
      new CustomEvent<QueueSearchMatch>('queue-search-match', {
        detail: {
          index,
          currentMatch: this.currentMatchIndex + 1,
          totalMatches: this.matchIndices.length,
          matchIndices: this.matchIndices,
        },
      }),
    );
  }

  private nextMatch() {
    if (this.matchIndices.length === 0) {
      return;
    }
    this.currentMatchIndex = (this.currentMatchIndex + 1) % this.matchIndices.length;
    this.highlightCurrentMatch();
  }

  private previousMatch() {
    if (this.matchIndices.length === 0) {
      return;
    }
    this.currentMatchIndex = (this.currentMatchIndex - 1 + this.matchIndices.length) % this.matchIndices.length;
    this.highlightCurrentMatch();
  }

  private onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      this.nextMatch();
    } else if (e.key === 'Escape') {
      this.resetSearchState(true);
    }
  }

  private resetSearchState(collapse = false, refocus = false) {
    this.searchText = '';
    this.matchIndices = [];
    this.currentMatchIndex = 0;
    this.lastHighlightedIndex = -1;
    this.showOnlyMatches = false;
    this.shownIndices = [];
    if (collapse) {
      this.expanded = false;
    }
    this.saveStateToLocalStorage();
    this.dispatchMatchEvent(-1);
    this.dispatchEvent(
      new CustomEvent('queue-search-show-only-matches', {
        detail: { showOnlyMatches: false, shownIndices: [] },
      }),
    );
    if (refocus) {
      this.updateComplete.then(() => this.input?.focus());
    }
  }

  private clearSearchText() {
    this.resetSearchState(false, true);
  }

  private selectAllMatches() {
    if (this.matchIndices.length > 0) {
      this.dispatchEvent(new CustomEvent('queue-search-select-all', { detail: { indices: this.matchIndices } }));
    }
  }

  static get styles() {
    return queueSearchStyles;
  }
}

customElements.define('sonos-queue-search', QueueSearch);
