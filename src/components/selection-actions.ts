import { css, html, LitElement, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { mdiSelectInverse } from '@mdi/js';
import { customEvent } from '../utils/utils';
import './play-menu';
import './icon-button';
import type { PlayMenuAction } from '../types';

export class SelectionActions extends LitElement {
  @property({ type: Boolean }) hasSelection = false;
  @property({ type: Boolean }) disabled = false;
  @property({ type: Boolean }) showInvert = true;

  render() {
    return html`
      ${this.showInvert
        ? html`<sonos-icon-button .path=${mdiSelectInverse} @click=${this.invertSelection} title="Invert selection"></sonos-icon-button>`
        : nothing}
      <sonos-play-menu .hasSelection=${this.hasSelection} .disabled=${this.disabled} @play-menu-action=${this.onPlayMenuAction}></sonos-play-menu>
    `;
  }

  private invertSelection() {
    this.dispatchEvent(customEvent('invert-selection'));
  }

  private onPlayMenuAction(e: CustomEvent<PlayMenuAction>) {
    const action = e.detail;
    switch (action.enqueue) {
      case 'replace':
        this.dispatchEvent(customEvent('play-selected', { enqueue: 'replace' }));
        break;
      case 'play':
        if (action.radioMode) {
          this.dispatchEvent(customEvent('play-selected', { enqueue: 'play', radioMode: true }));
        } else {
          this.dispatchEvent(customEvent('play-selected', { enqueue: 'play' }));
        }
        break;
      case 'next':
        this.dispatchEvent(customEvent('queue-selected', { enqueue: 'next' }));
        break;
      case 'add':
        this.dispatchEvent(customEvent('queue-selected-at-end', { enqueue: 'add' }));
        break;
      case 'replace_next':
        this.dispatchEvent(customEvent('queue-selected', { enqueue: 'replace_next' }));
        break;
    }
  }

  static styles = css`
    :host {
      display: contents;
    }
  `;
}

customElements.define('sonos-selection-actions', SelectionActions);
