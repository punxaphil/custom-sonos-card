import { CardConfig } from '../types';
import { html } from 'lit';
import { stylable } from '../utils';
import { StyleInfo } from 'lit-html/directives/style-map.js';

export interface IconButtonOptions {
  big?: boolean;
  additionalStyle?: StyleInfo;
}

export function iconButton(icon: string, click: () => void, config: CardConfig, options?: IconButtonOptions) {
  return html`<ha-icon-button
    @click="${click}"
    .path=${icon}
    style="${stylable('icon-button', config, {
      '--mdc-icon-button-size': options?.big ? '6rem' : '3rem',
      '--mdc-icon-size': options?.big ? '6rem' : '2rem',
      ...options?.additionalStyle,
    })}"
  ></ha-icon-button>`;
}
