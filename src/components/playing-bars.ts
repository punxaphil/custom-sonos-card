import { css, html, LitElement, nothing } from 'lit';
import { property } from 'lit/decorators.js';

class PlayingBars extends LitElement {
  @property({ type: Boolean }) show = false;

  render() {
    if (!this.show) {
      return nothing;
    }
    return html`
      <div class="bars">
        <div></div>
        <div></div>
        <div></div>
      </div>
    `;
  }

  static get styles() {
    return css`
      @keyframes sound {
        0% {
          opacity: 0.35;
          height: 0.15rem;
        }
        100% {
          opacity: 1;
          height: 1rem;
        }
      }

      :host {
        display: flex;
        align-items: center;
      }

      .bars {
        width: 0.55rem;
        height: 1rem;
        position: relative;
      }

      .bars > div {
        background: var(--secondary-text-color);
        bottom: 0;
        height: 0.15rem;
        position: absolute;
        width: 0.15rem;
        animation: sound 0ms -800ms linear infinite alternate;
        display: block;
      }

      .bars > div:first-child {
        left: 0.05rem;
        animation-duration: 474ms;
      }

      .bars > div:nth-child(2) {
        left: 0.25rem;
        animation-duration: 433ms;
      }

      .bars > div:last-child {
        left: 0.45rem;
        animation-duration: 407ms;
      }
    `;
  }
}

customElements.define('sonos-playing-bars', PlayingBars);
