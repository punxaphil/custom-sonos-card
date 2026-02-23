import { css, html, LitElement, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { styleMap } from 'lit-html/directives/style-map.js';

export class GroupingButton extends LitElement {
  @property() icon!: string;
  @property() name!: string;
  @property() selected!: boolean;
  @property() buttonColor?: string;
  @property() fontSize?: number;

  render() {
    const iconAndName = (!!this.icon && !!this.name) || nothing;
    const buttonStyle = styleMap({
      ...(this.buttonColor ? { '--control-button-background-color': this.buttonColor } : {}),
      ...(this.fontSize ? { fontSize: `${this.fontSize}rem` } : {}),
    });
    return html`
      <ha-control-button selected=${this.selected || nothing} style=${buttonStyle}>
        <div>
          ${this.icon ? html` <ha-icon icon-and-name=${iconAndName} .icon=${this.icon}></ha-icon>` : ''}
          ${this.name ? html`<span>${this.name}</span>` : ''}
        </div>
      </ha-control-button>
    `;
  }

  static get styles() {
    return css`
      ha-control-button {
        width: fit-content;
        --control-button-background-color: var(--secondary-text-color);
        --control-button-icon-color: var(--secondary-text-color);
      }
      ha-control-button[selected] {
        --control-button-icon-color: var(--accent-color);
      }

      span {
        font-weight: bold;
      }
    `;
  }
}

customElements.define('sonos-grouping-button', GroupingButton);
