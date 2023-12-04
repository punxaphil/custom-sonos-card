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
      ...iconStyle(options?.big),
      ...options?.additionalStyle,
    })}"
  ></ha-icon-button>`;
}

export function iconStyle(big = false) {
  return {
    '--mdc-icon-button-size': big ? '5rem' : '3rem',
    '--mdc-icon-size': big ? '5rem' : '2rem',
  };
}
