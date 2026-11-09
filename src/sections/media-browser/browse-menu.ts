import { css, html, nothing, TemplateResult } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { mdiAlphaABoxOutline, mdiCheck, mdiGrid, mdiListBoxOutline } from '@mdi/js';
import { HomeAssistant } from 'custom-card-helpers';
import { browserText } from './i18n';
import { LayoutType } from './media-browser.types';

export interface MenuRow {
  icon?: string;
  /** mdi:xxx icon name, rendered with ha-icon */
  haIcon?: string;
  label: string;
  onClick: () => void;
  checked?: boolean;
  accent?: boolean;
}

/**
 * Touch-friendly drop-down panel: big rows (52px), a segmented control for the layout,
 * and a backdrop that closes it when tapping anywhere else.
 */
export function renderMenuPanel(params: {
  hass: HomeAssistant;
  layout: LayoutType;
  onLayout: (layout: LayoutType) => void;
  rows: MenuRow[];
  onClose: () => void;
  footer?: TemplateResult | typeof nothing;
  /** Rendered right after the layout control. */
  extra?: TemplateResult | typeof nothing;
}) {
  const { hass, layout, onLayout, rows, onClose, footer = nothing, extra = nothing } = params;
  const layouts: { value: LayoutType; icon: string; label: string }[] = [
    { value: 'auto', icon: mdiAlphaABoxOutline, label: browserText(hass, 'layoutAuto') },
    { value: 'grid', icon: mdiGrid, label: browserText(hass, 'layoutGrid') },
    { value: 'list', icon: mdiListBoxOutline, label: browserText(hass, 'layoutList') },
  ];
  return html`
    <div class="menu-backdrop" @click=${onClose}></div>
    <div class="menu-panel" role="menu" @click=${(e: Event) => e.stopPropagation()}>
      <div class="menu-label">${browserText(hass, 'layout')}</div>
      <div class="segmented" role="radiogroup">
        ${layouts.map(
          (l) => html`
            <button role="radio" aria-checked=${layout === l.value} class=${classMap({ selected: layout === l.value })} @click=${() => onLayout(l.value)}>
              <ha-svg-icon .path=${l.icon}></ha-svg-icon>
              <span>${l.label}</span>
            </button>
          `,
        )}
      </div>
      ${extra} ${rows.length ? html`<div class="menu-sep"></div>` : nothing}
      ${rows.map(
        (row) => html`
          <button class="menu-row ${classMap({ accent: !!row.accent })}" role="menuitem" @click=${row.onClick}>
            ${row.haIcon ? html`<ha-icon .icon=${row.haIcon}></ha-icon>` : html`<ha-svg-icon .path=${row.icon}></ha-svg-icon>`}
            <span class="menu-row-label">${row.label}</span>
            ${row.checked ? html`<ha-svg-icon class="check" .path=${mdiCheck}></ha-svg-icon>` : nothing}
          </button>
        `,
      )}
      ${footer}
    </div>
  `;
}

export const menuStyles = css`
  .menu-backdrop {
    position: absolute;
    inset: 0;
    z-index: 20;
    background: rgba(0, 0, 0, 0.25);
    animation: fade-in 0.15s ease-out;
  }
  .menu-panel {
    position: absolute;
    top: 52px;
    right: 8px;
    z-index: 21;
    width: min(300px, calc(100% - 16px));
    max-height: calc(100% - 64px);
    overflow-y: auto;
    box-sizing: border-box;
    padding: 12px 8px 8px;
    border-radius: 16px;
    background: var(--card-background-color, var(--ha-card-background, #1c1c1c));
    color: var(--primary-text-color);
    box-shadow:
      0 12px 32px rgba(0, 0, 0, 0.35),
      0 0 0 1px var(--divider-color) inset;
    transform-origin: top right;
    animation: pop-in 0.16s ease-out;
  }
  .menu-label {
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--secondary-text-color);
    padding: 0 8px 8px;
  }
  .segmented {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
    padding: 4px;
    border-radius: 12px;
    background: rgba(127, 127, 127, 0.14);
  }
  .segmented button,
  .menu-row {
    font: inherit;
    color: inherit;
    border: none;
    background: none;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }
  .segmented button {
    height: 52px;
    border-radius: 9px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    font-size: 0.75rem;
    color: var(--secondary-text-color);
    transition:
      background 0.15s,
      color 0.15s;
  }
  .segmented button ha-svg-icon {
    --mdc-icon-size: 22px;
  }
  .segmented button.selected {
    background: var(--card-background-color, #1c1c1c);
    color: var(--accent-color, var(--primary-color));
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
    font-weight: 600;
  }
  .menu-hint {
    font-size: 0.75rem;
    color: var(--secondary-text-color);
    padding: 8px 8px 0;
  }
  .menu-sep {
    height: 1px;
    margin: 10px 4px 6px;
    background: var(--divider-color);
  }
  .menu-row {
    width: 100%;
    min-height: 52px;
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 0 12px;
    border-radius: 10px;
    text-align: left;
    font-size: 0.95rem;
  }
  .menu-row:active {
    background: rgba(127, 127, 127, 0.18);
  }
  @media (hover: hover) {
    .menu-row:hover,
    .segmented button:not(.selected):hover {
      background: rgba(127, 127, 127, 0.1);
    }
  }
  .menu-row ha-svg-icon,
  .menu-row ha-icon {
    --mdc-icon-size: 24px;
    color: var(--secondary-text-color);
    flex: none;
  }
  .menu-row.accent,
  .menu-row.accent ha-svg-icon {
    color: var(--accent-color, var(--primary-color));
  }
  .menu-row-label {
    flex: 1;
  }
  .menu-row .check {
    color: var(--accent-color, var(--primary-color));
  }
  .menu-confirm {
    margin: 4px;
    padding: 12px;
    border-radius: 12px;
    background: rgba(127, 127, 127, 0.12);
    font-size: 0.9rem;
  }
  .menu-confirm-actions {
    display: flex;
    gap: 8px;
    margin-top: 12px;
  }
  .menu-confirm-actions button {
    flex: 1;
    height: 44px;
    border-radius: 22px;
    border: 1px solid var(--divider-color);
    background: none;
    color: inherit;
    font: inherit;
    font-weight: 600;
    cursor: pointer;
  }
  .menu-confirm-actions button.primary {
    border: none;
    background: var(--accent-color, var(--primary-color));
    color: var(--text-primary-color, #fff);
  }
  @keyframes pop-in {
    from {
      opacity: 0;
      transform: scale(0.94) translateY(-6px);
    }
  }
  @keyframes fade-in {
    from {
      opacity: 0;
    }
  }
`;

/** Header shared by the favorites and library views: 56px row, 48px touch targets, 24px icons. */
export const navHeaderStyles = css`
  .nav-header {
    border-bottom: 1px solid var(--divider-color);
    background: var(--card-background-color);
    --icon-size: 24px;
    --icon-button-size: 48px;
  }
  .row {
    display: flex;
    align-items: center;
    min-height: 56px;
    padding: 0 4px;
    gap: 2px;
  }
  .title-section {
    gap: 2px;
  }
  .title-section .title {
    font-weight: 600;
  }
  sonos-icon-button.menu-open {
    color: var(--accent-color);
  }
`;
