import { css, html, LitElement, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import Store from '../../model/store';
import { GroupingItem } from '../../model/grouping-item';

class GroupingItemRow extends LitElement {
  @property({ attribute: false }) store!: Store;
  @property({ attribute: false }) item!: GroupingItem;
  @property({ type: Boolean }) applying = false;

  render() {
    const { item, applying, store } = this;
    const isModified = item.isModified || nothing;
    const isDisabled = item.isDisabled || applying || nothing;
    const isCompact = store.config.grouping?.compact || nothing;
    const isSelected = item.isSelected || nothing;
    return html`
      <div class="item" modified=${isModified} disabled=${isDisabled} compact=${isCompact}>
        <ha-icon class="icon" selected=${isSelected} .icon="mdi:${item.icon}" @click=${this.handleToggle}></ha-icon>
        <div class="name-and-volume">
          <span class="name">${item.name}</span>
          <sonos-volume
            class="volume"
            ?hidden=${!!store.config.grouping?.hideVolumes}
            .store=${store}
            .player=${item.player}
            .updateMembers=${false}
            .slim=${true}
          ></sonos-volume>
        </div>
      </div>
    `;
  }

  private handleToggle() {
    this.dispatchEvent(new CustomEvent('toggle-item', { detail: this.item, bubbles: true, composed: true }));
  }

  static get styles() {
    return css`
      .item {
        color: var(--secondary-text-color);
        padding: 0.5rem;
        display: flex;
        align-items: center;
      }
      .item[compact] {
        padding-top: 0;
        padding-bottom: 0;
        border-bottom: 1px solid #333;
      }
      .icon {
        padding-right: 0.5rem;
        flex-shrink: 0;
      }
      .icon[selected] {
        color: var(--accent-color);
      }
      .item[modified] .name {
        font-weight: bold;
        font-style: italic;
      }
      .item[disabled] .icon {
        color: var(--disabled-text-color);
      }
      .name-and-volume {
        display: flex;
        flex-direction: column;
        flex: 1;
      }
      .volume {
        --accent-color: var(--secondary-text-color);
      }
    `;
  }
}

customElements.define('sonos-grouping-item-row', GroupingItemRow);
