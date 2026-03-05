import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { mdiCheckAll, mdiChevronDown, mdiChevronUp, mdiClose, mdiEyeCheck } from '@mdi/js';
import { customEvent } from '../../utils/utils';
import { QueueSearchUiAction } from './queue.types';
import '../../components/icon-button';

export class QueueSearchPanel extends LitElement {
  @property() searchText = '';
  @property({ type: Boolean }) selectMode = false;
  @property({ type: Number }) matchCount = 0;
  @property({ type: Number }) currentMatchIndex = 0;
  @property({ type: Boolean }) hasNoMatch = false;
  @property({ type: Boolean }) showOnlyMatches = false;

  render() {
    const hasText = this.searchText.length > 0;
    const hasMatches = this.matchCount > 0;
    return html`
      <div class="search-row">
        <input
          type="text"
          placeholder="Search queue..."
          class=${this.hasNoMatch ? 'no-match' : ''}
          .value=${this.searchText}
          @input=${this.onInput}
          @keydown=${this.onKeyDown}
        />
        <span class="match-info" ?hidden=${!hasMatches}>${this.currentMatchIndex + 1}/${this.matchCount}</span>
        <sonos-icon-button .path=${mdiChevronUp} @click=${() => this.dispatchAction({ type: 'prev' })} ?hidden=${!hasMatches}></sonos-icon-button>
        <sonos-icon-button .path=${mdiChevronDown} @click=${() => this.dispatchAction({ type: 'next' })} ?hidden=${!hasMatches}></sonos-icon-button>
        <sonos-icon-button
          .path=${mdiCheckAll}
          @click=${() => this.dispatchAction({ type: 'select-all' })}
          title="Select all matches"
          ?hidden=${!hasMatches || !this.selectMode}
        ></sonos-icon-button>
        <sonos-icon-button
          .path=${mdiEyeCheck}
          @click=${() => this.dispatchAction({ type: 'toggle-show-only' })}
          ?selected=${this.showOnlyMatches}
          title="Show only matches"
          ?hidden=${!hasText}
        ></sonos-icon-button>
        <sonos-icon-button
          .path=${mdiClose}
          @click=${() => this.dispatchAction({ type: 'clear' })}
          title="Clear search"
          ?hidden=${!hasText}
        ></sonos-icon-button>
      </div>
    `;
  }

  focusInput() {
    this.shadowRoot?.querySelector<HTMLInputElement>('input')?.focus();
  }

  private onInput(e: Event) {
    const value = (e.target as HTMLInputElement).value;
    this.dispatchAction({ type: 'input', payload: { value } });
  }

  private onKeyDown(e: KeyboardEvent) {
    this.dispatchAction({ type: 'keydown', payload: { key: e.key } });
  }

  private dispatchAction(action: QueueSearchUiAction) {
    this.dispatchEvent(customEvent('queue-search-ui-action', action));
  }

  static styles = css`
    :host {
      display: block;
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      z-index: 10;
    }
    :host([hidden]) {
      display: none !important;
    }
    [hidden] {
      display: none !important;
    }
    .search-row {
      display: flex;
      align-items: center;
      padding: 0.5rem;
      background: var(--card-background-color, #1c1c1c);
      border-bottom: 1px solid var(--divider-color, #e0e0e0);
    }
    input {
      flex: 1;
      padding: 0.5rem;
      border: 1px solid var(--divider-color, #ccc);
      border-radius: 4px;
      font-size: var(--sonos-font-size, 1rem);
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color, #000);
    }
    input:focus {
      outline: none;
      border-color: var(--accent-color, #03a9f4);
    }
    input.no-match {
      border-color: var(--error-color, red);
    }
    .match-info {
      padding: 0 0.5rem;
      font-size: calc(var(--sonos-font-size, 1rem) * 0.9);
      color: var(--secondary-text-color, #666);
      white-space: nowrap;
    }
    .search-row sonos-icon-button {
      --icon-button-size: 2rem;
      --icon-size: 1.2rem;
    }
    .search-row sonos-icon-button[selected] {
      color: var(--accent-color);
    }
  `;
}

customElements.define('sonos-queue-search-panel', QueueSearchPanel);
