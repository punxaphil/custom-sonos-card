import { html } from 'lit';
import { StyleInfo, styleMap } from 'lit-html/directives/style-map.js';

export interface IconButtonOptions {
  big?: boolean;
  additionalStyle?: StyleInfo;
}

export function iconButton(icon: string, click: () => void, options?: IconButtonOptions) {
  return html`<ha-icon-button
    @click="${click}"
    .path=${icon}
    style="${styleMap({
      '--mdc-icon-button-size': options?.big ? '6rem' : '3rem',
      '--mdc-icon-size': options?.big ? '6rem' : '2rem',
      ...options?.additionalStyle,
    })}"
  ></ha-icon-button>`;
}
