import { css, html, LitElement, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { mdiAccessPoint, mdiClose, mdiPlay, mdiPlayBoxMultiple, mdiPlaylistPlus, mdiSkipNext, mdiSkipNextCircle } from '@mdi/js';
import { customEvent } from '../utils/utils';
import { PlayMenuAction } from '../types';

const PLAY_MENU_ACTIONS: PlayMenuAction[] = [
  { enqueue: 'replace' },
  { enqueue: 'play', radioMode: true },
  { enqueue: 'play' },
  { enqueue: 'next' },
  { enqueue: 'add' },
  { enqueue: 'replace_next' },
];

export class PlayMenu extends LitElement {
  @property({ type: Boolean }) disabled = false;
  @property({ type: Boolean }) hasSelection = false;
  /** When true, renders as an already-open dropdown panel instead of a trigger button */
  @property({ type: Boolean }) inline = false;

  render() {
    if (!this.hasSelection) {
      return nothing;
    }
    if (this.inline) {
      return this.renderInlineMenu();
    }
    return this.renderButtonMenu();
  }

  private renderButtonMenu() {
    return html`
      <ha-dropdown @wa-select=${this.handleAction}>
        <ha-icon-button slot="trigger" .path=${mdiPlay} title="Play options" ?disabled=${this.disabled}></ha-icon-button>
        ${this.renderMenuItems()}
      </ha-dropdown>
    `;
  }

  private renderInlineMenu() {
    return html`
      <div class="inline-menu" @click=${(e: Event) => e.stopPropagation()}>
        <ha-icon-button class="close-btn" .path=${mdiClose} @click=${this.closeMenu} title="Close"></ha-icon-button>
        ${PLAY_MENU_ACTIONS.map(
          (_action, index) => html`
            <div class="inline-menu-item" @click=${() => this.selectAction(index)}>
              <ha-svg-icon .path=${this.getActionIcon(index)}></ha-svg-icon>
              <span>${this.getActionLabel(index)}</span>
            </div>
          `,
        )}
      </div>
    `;
  }

  private renderMenuItems() {
    return html`
      <ha-dropdown-item value="0">
        <ha-svg-icon slot="icon" .path=${mdiPlayBoxMultiple}></ha-svg-icon>
        Play Now (clear queue)
      </ha-dropdown-item>
      <ha-dropdown-item value="1">
        <ha-svg-icon slot="icon" .path=${mdiAccessPoint}></ha-svg-icon>
        Start Radio
      </ha-dropdown-item>
      <ha-dropdown-item value="2">
        <ha-svg-icon slot="icon" .path=${mdiPlay}></ha-svg-icon>
        Play Now
      </ha-dropdown-item>
      <ha-dropdown-item value="3">
        <ha-svg-icon slot="icon" .path=${mdiSkipNext}></ha-svg-icon>
        Play Next
      </ha-dropdown-item>
      <ha-dropdown-item value="4">
        <ha-svg-icon slot="icon" .path=${mdiPlaylistPlus}></ha-svg-icon>
        Add to Queue
      </ha-dropdown-item>
      <ha-dropdown-item value="5">
        <ha-svg-icon slot="icon" .path=${mdiSkipNextCircle}></ha-svg-icon>
        Play Next (clear queue)
      </ha-dropdown-item>
    `;
  }

  private getActionIcon(index: number): string {
    return [mdiPlayBoxMultiple, mdiAccessPoint, mdiPlay, mdiSkipNext, mdiPlaylistPlus, mdiSkipNextCircle][index];
  }

  private getActionLabel(index: number): string {
    return ['Play Now (clear queue)', 'Start Radio', 'Play Now', 'Play Next', 'Add to Queue', 'Play Next (clear queue)'][index];
  }

  private handleAction(e: CustomEvent<{ item: { value: string } }>) {
    const action = PLAY_MENU_ACTIONS[parseInt(e.detail.item.value)];
    if (action) {
      this.dispatchEvent(customEvent('play-menu-action', action));
    }
  }

  private selectAction(index: number) {
    const action = PLAY_MENU_ACTIONS[index];
    if (action) {
      this.dispatchEvent(customEvent('play-menu-action', action));
    }
  }

  private closeMenu() {
    this.dispatchEvent(customEvent('play-menu-close'));
  }

  static styles = css`
    :host {
      display: contents;
    }
    .inline-menu {
      position: relative;
      background: var(--card-background-color, var(--primary-background-color));
      border: 1px solid var(--divider-color, rgba(255, 255, 255, 0.12));
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      min-width: 200px;
      padding: 17px 17px;
      z-index: 10;
    }
    .close-btn {
      position: absolute;
      top: 2px;
      right: 2px;
      --mdc-icon-button-size: 28px;
      --mdc-icon-size: 18px;
      color: var(--secondary-text-color);
    }
    .inline-menu-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 16px;
      cursor: pointer;
      color: var(--primary-text-color);
      font-size: 0.9rem;
    }
    .inline-menu-item:hover {
      background: var(--secondary-background-color);
    }
    .inline-menu-item ha-svg-icon {
      --mdc-icon-size: 20px;
      flex-shrink: 0;
    }
  `;
}

customElements.define('sonos-play-menu', PlayMenu);
