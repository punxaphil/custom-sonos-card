import { html, LitElement } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { mdiMagnify } from '@mdi/js';
import type { MediaPlayerItem } from '../../types';
import { customEvent } from '../../utils/utils';
import { createQueueSearchMatch, findMatchIndices, getCurrentMatchIndex, restoreQueueSearchState, saveQueueSearchState } from './queue-search-utils';
import { queueSearchStyles } from './queue-search.styles';
import type { QueueSearchAction, QueueSearchUiAction } from './queue.types';
import './queue-search-panel';
import '../../components/icon-button';

export class QueueSearch extends LitElement {
  @property({ attribute: false }) items: MediaPlayerItem[] = [];
  @property({ type: Boolean }) selectMode = false;
  @state() private expanded = false;
  @state() private searchText = '';
  @state() private matchIndices: number[] = [];
  @state() private currentMatchIndex = 0;
  @state() private showOnlyMatches = false;
  @query('sonos-queue-search-panel') private panel?: { focusInput: () => void };

  connectedCallback() {
    super.connectedCallback();
    const saved = restoreQueueSearchState();
    if (!saved) {
      return;
    }
    this.searchText = saved.searchText.trim();
    this.expanded = this.searchText.length > 0 && saved.expanded;
    this.showOnlyMatches = saved.showOnlyMatches;
  }

  protected willUpdate(changedProperties: Map<PropertyKey, unknown>): void {
    if (changedProperties.has('items') && this.searchText) {
      this.runSearch(false);
    }
  }

  protected updated(changedProperties: Map<PropertyKey, unknown>) {
    if (changedProperties.has('expanded') && this.expanded) {
      this.panel?.focusInput();
    }
  }

  render() {
    const hasNoMatch = this.searchText.length > 0 && this.matchIndices.length === 0;
    return html`
      <sonos-icon-button
        .path=${mdiMagnify}
        @click=${this.toggleExpanded}
        ?selected=${this.expanded || this.searchText.length > 0}
        title="Search queue"
      ></sonos-icon-button>
      <sonos-queue-search-panel
        ?hidden=${!this.expanded}
        .searchText=${this.searchText}
        .selectMode=${this.selectMode}
        .matchCount=${this.matchIndices.length}
        .currentMatchIndex=${this.currentMatchIndex}
        .hasNoMatch=${hasNoMatch}
        .showOnlyMatches=${this.showOnlyMatches}
        @queue-search-ui-action=${this.onUiAction}
      ></sonos-queue-search-panel>
    `;
  }

  private toggleExpanded = () => {
    this.expanded = !this.expanded;
    this.dispatch({ type: 'expanded', payload: { expanded: this.expanded } });
    this.persistState();
  };

  private onUiAction = (e: CustomEvent<QueueSearchUiAction>) => {
    const action = e.detail;
    if (action.type === 'input') {
      this.searchText = action.payload.value;
      this.runSearch(false);
      this.persistState();
      return;
    }
    if (action.type === 'keydown') {
      if (action.payload.key === 'Enter') {
        this.moveMatch(false);
      }
      if (action.payload.key === 'Escape') {
        this.clearSearch();
      }
      return;
    }
    if (action.type === 'next') {
      this.moveMatch(false);
      return;
    }
    if (action.type === 'prev') {
      this.moveMatch(true);
      return;
    }
    if (action.type === 'select-all') {
      this.dispatch({ type: 'select-all', payload: { indices: this.matchIndices } });
      return;
    }
    if (action.type === 'toggle-show-only') {
      this.showOnlyMatches = !this.showOnlyMatches;
      this.dispatch({ type: 'show-only', payload: { showOnlyMatches: this.showOnlyMatches, shownIndices: this.showOnlyMatches ? this.matchIndices : [] } });
      this.persistState();
      return;
    }
    if (action.type === 'clear') {
      this.clearSearch();
    }
  };

  private runSearch(continueFromCurrent: boolean) {
    if (!this.searchText.trim()) {
      this.matchIndices = [];
      this.currentMatchIndex = 0;
      this.showOnlyMatches = false;
      this.dispatch({ type: 'match', payload: { index: -1, currentMatch: 0, totalMatches: 0, matchIndices: [] } });
      this.dispatch({ type: 'show-only', payload: { showOnlyMatches: false, shownIndices: [] } });
      return;
    }
    const matchIndices = findMatchIndices(this.items, this.searchText);
    this.matchIndices = matchIndices;
    if (matchIndices.length === 0) {
      this.currentMatchIndex = 0;
      this.dispatch({ type: 'match', payload: { index: -1, currentMatch: 0, totalMatches: 0, matchIndices: [] } });
      this.dispatch({ type: 'show-only', payload: { showOnlyMatches: false, shownIndices: [] } });
      this.showOnlyMatches = false;
      return;
    }
    const lastHighlighted = this.matchIndices[this.currentMatchIndex] ?? -1;
    this.currentMatchIndex = getCurrentMatchIndex(matchIndices, continueFromCurrent, lastHighlighted);
    const match = createQueueSearchMatch(matchIndices[this.currentMatchIndex], this.currentMatchIndex, matchIndices);
    this.dispatch({ type: 'match', payload: match });
    this.dispatch({ type: 'show-only', payload: { showOnlyMatches: this.showOnlyMatches, shownIndices: this.showOnlyMatches ? this.matchIndices : [] } });
  }

  private moveMatch(reverse: boolean) {
    if (this.matchIndices.length === 0) {
      return;
    }
    const delta = reverse ? -1 : 1;
    this.currentMatchIndex = (this.currentMatchIndex + delta + this.matchIndices.length) % this.matchIndices.length;
    const match = createQueueSearchMatch(this.matchIndices[this.currentMatchIndex], this.currentMatchIndex, this.matchIndices);
    this.dispatch({ type: 'match', payload: match });
  }

  private clearSearch() {
    this.searchText = '';
    this.matchIndices = [];
    this.currentMatchIndex = 0;
    this.showOnlyMatches = false;
    this.dispatch({ type: 'match', payload: { index: -1, currentMatch: 0, totalMatches: 0, matchIndices: [] } });
    this.dispatch({ type: 'show-only', payload: { showOnlyMatches: false, shownIndices: [] } });
    this.persistState();
  }

  private persistState() {
    saveQueueSearchState({ expanded: this.expanded, searchText: this.searchText, showOnlyMatches: this.showOnlyMatches });
  }

  private dispatch(action: QueueSearchAction) {
    this.dispatchEvent(customEvent('queue-search-action', action));
  }

  static styles = queueSearchStyles;
}

customElements.define('sonos-queue-search', QueueSearch);
