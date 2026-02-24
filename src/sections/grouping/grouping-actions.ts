import { css, html, LitElement, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import Store from '../../model/store';
import { PredefinedGroup } from '../../types';
import './grouping-button';

class GroupingActions extends LitElement {
  @property({ attribute: false }) store!: Store;
  @property({ attribute: false }) selectedPredefinedGroup?: PredefinedGroup;

  render() {
    const { store, selectedPredefinedGroup } = this;
    const { joinedCount, notJoinedCount } = store.getJoinedAndNotJoinedCounts();
    const joinAllIcon = store.config.grouping?.buttonIcons?.joinAll ?? 'mdi:checkbox-multiple-marked-outline';
    const unJoinAllIcon = store.config.grouping?.buttonIcons?.unJoinAll ?? 'mdi:minus-box-multiple-outline';
    const pgIcon = store.config.grouping?.buttonIcons?.predefinedGroup ?? 'mdi:speaker-multiple';
    const fontSize = store.config.grouping?.buttonFontSize;
    const isCompact = store.config.grouping?.compact || nothing;
    const hideUngroupButtons = !!store.config.grouping?.hideUngroupAllButtons;
    return html`
      <div class="predefined-groups" compact=${isCompact}>
        <sonos-grouping-button
          ?hidden=${hideUngroupButtons || !notJoinedCount}
          @click=${() => this.dispatch({ type: 'select-all' })}
          .icon=${joinAllIcon}
          .buttonColor=${store.config.grouping?.buttonColor}
          .fontSize=${fontSize}
        ></sonos-grouping-button>
        <sonos-grouping-button
          ?hidden=${hideUngroupButtons || !joinedCount}
          @click=${() => this.dispatch({ type: 'deselect-all' })}
          .icon=${unJoinAllIcon}
          .buttonColor=${store.config.grouping?.buttonColor}
          .fontSize=${fontSize}
        ></sonos-grouping-button>
        ${store.predefinedGroups.map((pg) => {
          const isSelected = selectedPredefinedGroup?.name === pg.name;
          return html` <sonos-grouping-button
            @click=${() => this.dispatch({ type: 'select-predefined-group', predefinedGroup: pg })}
            .icon=${pgIcon}
            .name=${pg.name}
            .selected=${isSelected}
            .buttonColor=${store.config.grouping?.buttonColor}
            .fontSize=${fontSize}
          ></sonos-grouping-button>`;
        })}
      </div>
    `;
  }

  private dispatch(detail: { type: string; predefinedGroup?: PredefinedGroup }) {
    this.dispatchEvent(new CustomEvent('grouping-action', { detail, bubbles: true, composed: true }));
  }

  static get styles() {
    return css`
      .predefined-groups {
        margin: 1rem;
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        justify-content: center;
        flex-shrink: 0;
      }
      .predefined-groups[compact] {
        margin: 0.3rem !important;
      }
    `;
  }
}

customElements.define('sonos-grouping-actions', GroupingActions);
