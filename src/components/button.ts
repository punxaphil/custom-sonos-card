import { html } from 'lit';
import { styleMap } from 'lit-html/directives/style-map.js';

export function getButton(click: () => void, icon: string | null, name = '') {
  return html`
    <ha-control-button @click="${click}" style=${buttonStyle()}>
      ${icon ? html`<ha-icon .icon=${icon} style=${iconStyle()}></ha-icon>` : ''}
      ${name ? html`<span style=${textStyle()}>${name}</span>` : ''}
    </ha-control-button>
  `;
}

function buttonStyle() {
  return styleMap({
    width: 'fit-content',
    '--control-button-background-color': 'var(--accent-color)',
    '--control-button-icon-color': 'var(--secondary-text-color)',
  });
}

function iconStyle() {
  return styleMap({ paddingRight: '1rem' });
}

function textStyle() {
  return styleMap({ paddingRight: '1rem', paddingLeft: '1rem', fontWeight: 'bold' });
}
