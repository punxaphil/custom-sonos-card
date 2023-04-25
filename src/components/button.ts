import { html } from 'lit';
import { stylable } from '../utils';
import { CardConfig } from '../types';

export function getButton(click: () => void, icon: string, name: string, config: CardConfig) {
  return html`
    <mwc-button @click="${click}" style="${buttonStyle(config)}" outlined>
      ${name ? html`<span style="${buttonNameStyle(config)}">${name}</span>` : ''}
      <ha-icon .icon=${icon} style="${buttonIconStyle(config)}"></ha-icon>
    </mwc-button>
  `;
}

function buttonStyle(config: CardConfig) {
  return stylable('button', config, {
    borderRadius: 'var(--sonos-int-border-radius)',
    margin: '0.5rem 0 0 0.5rem',
    justifyContent: 'center',
    backgroundColor: 'var(--sonos-int-background-color)',
    '--mdc-button-outline-width': '2px',
    '--mdc-button-outline-color': 'var(--sonos-int-accent-color)',
    '--mdc-theme-primary': 'var(--sonos-int-accent-color)',
  });
}

function buttonNameStyle(config: CardConfig) {
  return stylable('button-name', config, {
    alignSelf: 'center',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  });
}

function buttonIconStyle(config: CardConfig) {
  return stylable('button-icon', config, {
    alignSelf: 'center',
    '--mdc-icon-size': '20px',
    paddingLeft: '0.1rem',
  });
}
