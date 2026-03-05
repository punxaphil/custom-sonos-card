import { css, html, LitElement } from 'lit';
import { property, query } from 'lit/decorators.js';
import { mdiClose, mdiMagnify } from '@mdi/js';
import { customEvent } from '../../utils/utils';
import { SearchMediaType } from '../../types';
import { getSearchTypeLabels } from './search-utils';
import '../../components/icon-button';

export class SearchBar extends LitElement {
  @property() searchText = '';
  @property({ attribute: false }) mediaTypes!: Set<SearchMediaType>;
  @query('input') private input?: HTMLInputElement;

  render() {
    const typeLabels = getSearchTypeLabels(this.mediaTypes);
    return html`
      <div class="search-bar">
        <sonos-icon-button .path=${mdiMagnify} @click=${() => this.dispatchEvent(customEvent('search-submit'))}></sonos-icon-button>
        <input type="text" placeholder="Search ${typeLabels}..." .value=${this.searchText} @input=${this.onInput} @keydown=${this.onKeyDown} />
        <sonos-icon-button
          .path=${mdiClose}
          @click=${() => this.dispatchEvent(customEvent('clear-search'))}
          title="Clear"
          ?hidden=${!this.searchText}
        ></sonos-icon-button>
      </div>
    `;
  }

  focusInput() {
    this.updateComplete.then(() => this.input?.focus());
  }

  private onInput(e: Event) {
    const input = e.target as HTMLInputElement;
    this.dispatchEvent(customEvent('search-input', input.value));
  }

  private onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      this.dispatchEvent(customEvent('search-submit'));
    }
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
      .search-bar {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: var(--secondary-background-color);
        margin: 0 0.5rem;
        border-radius: 0.5rem;
      }
      .search-bar input {
        flex: 1;
        border: none;
        background: transparent;
        color: var(--primary-text-color);
        font-size: 1rem;
        outline: none;
        padding: 0.5rem;
      }
      .search-bar input::placeholder {
        color: var(--secondary-text-color);
      }
    `;
  }
}

customElements.define('sonos-search-bar', SearchBar);
