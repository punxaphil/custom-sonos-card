import { html } from 'lit';
import { mdiAlphaABoxOutline, mdiDotsVertical, mdiGrid, mdiListBoxOutline } from '@mdi/js';
import { styleMap } from 'lit/directives/style-map.js';

const selectedStyle = { color: 'var(--accent-color)' };

export function renderLayoutMenu(layout: string, onSelect: (ev: CustomEvent<{ item: { value: string } }>) => void) {
  return html`
    <ha-dropdown @wa-select=${onSelect}>
      <ha-icon-button slot="trigger" .path=${mdiDotsVertical}></ha-icon-button>
      <ha-dropdown-item value="auto" .selected=${layout === 'auto'} style=${styleMap(layout === 'auto' ? selectedStyle : {})}>
        <ha-svg-icon slot="icon" .path=${mdiAlphaABoxOutline}></ha-svg-icon>
        Auto
      </ha-dropdown-item>
      <ha-dropdown-item value="grid" .selected=${layout === 'grid'} style=${styleMap(layout === 'grid' ? selectedStyle : {})}>
        <ha-svg-icon slot="icon" .path=${mdiGrid}></ha-svg-icon>
        Grid
      </ha-dropdown-item>
      <ha-dropdown-item value="list" .selected=${layout === 'list'} style=${styleMap(layout === 'list' ? selectedStyle : {})}>
        <ha-svg-icon slot="icon" .path=${mdiListBoxOutline}></ha-svg-icon>
        List
      </ha-dropdown-item>
    </ha-dropdown>
  `;
}
