import { css, html, LitElement, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { HomeAssistant } from 'custom-card-helpers';
import { OperationProgress } from '../types';
import { customEvent } from '../utils/utils';

export class OperationOverlay extends LitElement {
  @property({ attribute: false }) progress?: OperationProgress;
  @property({ attribute: false }) hass?: HomeAssistant;

  render() {
    if (!this.progress) {
      return nothing;
    }

    const progressText = this.progress.total > 1 ? `${this.progress.label} ${this.progress.current} of ${this.progress.total}` : `${this.progress.label}...`;

    return html`
      <div class="operation-overlay">
        <div class="operation-overlay-content">
          <ha-spinner></ha-spinner>
          <div class="operation-progress-text">${progressText}</div>
          <ha-control-button-group>
            <ha-control-button class="accent" @click=${this.onCancel}> ${this.hass?.localize('ui.common.cancel') || 'Cancel'} </ha-control-button>
          </ha-control-button-group>
        </div>
      </div>
    `;
  }

  private onCancel() {
    this.dispatchEvent(customEvent('cancel-operation'));
  }

  static get styles() {
    return css`
      .operation-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.85);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 100;
      }
      .operation-overlay-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        padding: 2rem;
        text-align: center;
      }
      .operation-progress-text {
        font-size: 1.2rem;
        color: var(--primary-text-color, #fff);
      }
      .accent {
        --control-button-background-color: var(--accent-color);
      }
    `;
  }
}

customElements.define('sonos-operation-overlay', OperationOverlay);
