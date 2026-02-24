import { html, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';
import Store from '../../model/store';
import { dispatchActivePlayerId, getGroupingChanges } from '../../utils/utils';
import { MediaPlayer } from '../../model/media-player';
import { PredefinedGroup } from '../../types';
import { GroupingItem } from '../../model/grouping-item';
import { groupingSectionStyles } from './grouping-section.styles';
import { buildGroupingItems, waitForGroupSync } from './grouping-utils';
import './grouping-actions';
import './grouping-item-row';

const POST_SYNC_DELAY = 1000;

export class Grouping extends LitElement {
  @property({ attribute: false }) store!: Store;
  @state() modifiedItems: string[] = [];
  @state() selectedPredefinedGroup?: PredefinedGroup;
  @state() private applying = false;
  private groupingItems!: GroupingItem[];
  private frozenGroupingItems?: GroupingItem[];

  render() {
    if (!this.applying) {
      this.refreshFromStore();
    }
    const items = this.frozenGroupingItems ?? this.groupingItems;
    const { applying, selectedPredefinedGroup, modifiedItems, store } = this;
    const hasChanges = modifiedItems.length > 0 || !!selectedPredefinedGroup;
    const hideButtons = applying || !hasChanges || !!store.config.grouping?.skipApplyButton;
    return html`
      <div class="wrapper">
        <sonos-grouping-actions
          .store=${store}
          .selectedPredefinedGroup=${selectedPredefinedGroup}
          @grouping-action=${this.handleGroupingAction}
        ></sonos-grouping-actions>
        <div class="list">
          ${items.map(
            (item) => html`
              <sonos-grouping-item-row .store=${store} .item=${item} .applying=${applying} @toggle-item=${this.handleToggleItem}></sonos-grouping-item-row>
            `,
          )}
        </div>
        <div class="applying" ?hidden=${!applying}><ha-spinner></ha-spinner></div>
        <ha-control-button-group class="buttons" ?hidden=${hideButtons}>
          <ha-control-button class="apply" @click=${this.applyGrouping}> ${store.hass.localize('ui.common.apply') || 'Apply'} </ha-control-button>
          <ha-control-button @click=${this.cancelGrouping}> ${store.hass.localize('ui.common.cancel') || 'Cancel'} </ha-control-button>
        </ha-control-button-group>
      </div>
    `;
  }

  static get styles() {
    return groupingSectionStyles;
  }

  private handleGroupingAction(e: CustomEvent) {
    const { type, predefinedGroup } = e.detail;
    if (type === 'select-all') {
      this.selectAll();
    } else if (type === 'deselect-all') {
      this.deSelectAll();
    } else if (type === 'select-predefined-group') {
      this.selectPredefinedGroup(predefinedGroup);
    }
  }

  private handleToggleItem(e: CustomEvent) {
    this.toggleItem(e.detail);
  }

  private toggleItem(item: GroupingItem) {
    if (item.isDisabled || this.applying) {
      return;
    }
    this.toggleModifiedItem(item);
  }

  private toggleModifiedItem(item: GroupingItem) {
    this.modifiedItems = this.modifiedItems.includes(item.player.id)
      ? this.modifiedItems.filter((id) => id !== item.player.id)
      : [...this.modifiedItems, item.player.id];
    this.selectedPredefinedGroup = undefined;
  }

  async applyGrouping() {
    if (this.applying) {
      return;
    }
    const activePlayer = this.store.activePlayer;
    const joinedPlayers = this.store.getJoinedPlayerIds();
    const { unJoin, join, newMainPlayer } = getGroupingChanges(this.groupingItems, joinedPlayers, activePlayer.id);
    const selectedPG = this.selectedPredefinedGroup;
    const expectedIds = this.groupingItems
      .filter((i) => i.isSelected)
      .map((i) => i.player.id)
      .sort();
    this.frozenGroupingItems = this.groupingItems.map((item) =>
      Object.assign(new GroupingItem(item.player, activePlayer, item.isModified), {
        isSelected: item.isSelected,
      }),
    );
    this.applying = true;
    this.modifiedItems = [];
    this.selectedPredefinedGroup = undefined;
    try {
      await this.executeChanges(join, unJoin, newMainPlayer, selectedPG);
      this.switchActivePlayerIfNeeded(activePlayer, newMainPlayer, unJoin);
      await waitForGroupSync(this.store, newMainPlayer, expectedIds);
      await new Promise((resolve) => setTimeout(resolve, POST_SYNC_DELAY));
    } finally {
      this.applying = false;
      this.frozenGroupingItems = undefined;
    }
  }

  private refreshFromStore() {
    this.groupingItems = buildGroupingItems(this.store, this.modifiedItems);
    const hasChanges = this.modifiedItems.length > 0 || !!this.selectedPredefinedGroup;
    if (this.store.config.grouping?.skipApplyButton && hasChanges) {
      this.applyGrouping();
    }
  }

  private async executeChanges(join: string[], unJoin: string[], mainPlayer: string, pg?: PredefinedGroup) {
    if (join.length) {
      await this.store.mediaControlService.join(mainPlayer, join);
    }
    if (unJoin.length) {
      await this.store.mediaControlService.unJoin(unJoin);
    }
    if (pg) {
      await this.store.mediaControlService.activatePredefinedGroup(pg);
    }
  }

  private switchActivePlayerIfNeeded(activePlayer: MediaPlayer, newMainPlayer: string, unJoin: string[]) {
    if (newMainPlayer !== activePlayer.id && !this.store.config.grouping?.dontSwitchPlayer) {
      dispatchActivePlayerId(newMainPlayer, this.store.config, this);
    }
    if (this.store.config.entityId && unJoin.includes(this.store.config.entityId) && this.store.config.grouping?.dontSwitchPlayer) {
      dispatchActivePlayerId(this.store.config.entityId, this.store.config, this);
    }
  }

  private cancelGrouping() {
    if (this.applying) {
      return;
    }
    this.modifiedItems = [];
    this.selectedPredefinedGroup = undefined;
  }

  private async selectPredefinedGroup(pg: PredefinedGroup) {
    let hasChanges = false;
    for (const item of this.groupingItems) {
      const shouldBeSelected = pg.entities.some((e) => e.player.id === item.player.id);
      if (shouldBeSelected !== item.isSelected) {
        this.toggleModifiedItem(item);
        hasChanges = true;
      }
    }
    this.selectedPredefinedGroup = pg;
    if (!hasChanges && this.store.config.grouping?.skipApplyButton) {
      await this.store.mediaControlService.activatePredefinedGroup(pg);
      this.selectedPredefinedGroup = undefined;
    }
  }

  private selectAll() {
    this.groupingItems.filter((item) => !item.isSelected).forEach((item) => this.toggleItem(item));
  }

  private deSelectAll() {
    this.groupingItems.filter((item) => (!item.isMain && item.isSelected) || (item.isMain && !item.isSelected)).forEach((item) => this.toggleItem(item));
  }
}
