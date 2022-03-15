import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { CardConfig } from '../types';
import { StyleInfo, styleMap } from 'lit-html/directives/style-map.js';

class Stylable extends LitElement {
  @property() config!: { config: CardConfig; name: string };
  @property() additionalStyle!: StyleInfo;
  @property() show = true;

  render() {
    let style = this.config.config.styles?.[this.config.name] || {};
    style = { ...this.additionalStyle, ...style };
    if (!this.show) {
      style = { ...style, display: 'none' };
    }
    return html`
      <div class="${this.config.name}" style="${styleMap(style)}">
        <slot></slot>
      </div>
    `;
  }

  static get styles() {
    return css`
      :host {
        display: block;
      }
    `;
  }
}

customElements.define('div-styled', Stylable);
