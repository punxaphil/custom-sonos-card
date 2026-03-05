import { css, html, LitElement, nothing } from 'lit';
import { property } from 'lit/decorators.js';

class IconButton extends LitElement {
  @property() path?: string;
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ reflect: true }) selected?: string;
  @property() title = '';

  render() {
    return html`
      <button ?disabled=${this.disabled} title=${this.title || nothing} aria-label=${this.title || nothing}>
        ${this.path ? html`<ha-svg-icon .path=${this.path}></ha-svg-icon>` : html`<slot></slot>`}
      </button>
    `;
  }

  static get styles() {
    return css`
      :host {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        align-self: center;
        --sc-icon-button-size: var(--icon-button-size, 3rem);
        --sc-icon-size: var(--icon-size, 2rem);
      }
      :host([hide]),
      :host([hidden]) {
        display: none !important;
      }
      button {
        cursor: pointer;
        background: none;
        border: none;
        padding: 0;
        margin: 0;
        color: inherit;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: var(--sc-icon-button-size);
        height: var(--sc-icon-button-size);
        border-radius: 50%;
        outline: none;
        -webkit-tap-highlight-color: transparent;
        position: relative;
        overflow: hidden;
      }
      button::before {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 50%;
        opacity: 0;
        background: currentColor;
        transition: opacity 0.12s;
      }
      button:hover::before {
        opacity: 0.08;
      }
      button:active::before {
        opacity: 0.12;
      }
      button:disabled {
        cursor: default;
        opacity: 0.38;
      }
      button:disabled::before {
        display: none;
      }
      ha-svg-icon {
        display: flex;
        --mdc-icon-size: var(--sc-icon-size);
        width: var(--sc-icon-size);
        height: var(--sc-icon-size);
      }
      ::slotted(ha-icon) {
        --mdc-icon-size: var(--sc-icon-size);
      }
    `;
  }
}

customElements.define('sonos-icon-button', IconButton);
