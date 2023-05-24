import { html } from 'lit';
import { styleMap } from 'lit-html/directives/style-map.js';

export function getButton(click: () => void, icon: string, name: string) {
  return html`
    <mwc-button @click="${click}" style="${buttonStyle()}" outlined>
      ${name ? html`<span style="${buttonNameStyle()}">${name}</span>` : ''}
      <ha-icon .icon=${icon} style="${buttonIconStyle()}"></ha-icon>
    </mwc-button>
  `;
}

function buttonStyle() {
  return styleMap({
    borderRadius: '0.25rem',
    margin: '0.5rem 0 0 0.5rem',
    justifyContent: 'center',
    '--mdc-button-outline-width': '2px',
    '--mdc-button-outline-color': 'var(--accent-color)',
    '--mdc-theme-primary': 'var(--accent-color)',
  });
}

function buttonNameStyle() {
  return styleMap({
    alignSelf: 'center',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  });
}

function buttonIconStyle() {
  return styleMap({
    alignSelf: 'center',
    '--mdc-icon-size': '20px',
    paddingLeft: '0.1rem',
  });
}
