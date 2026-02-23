import { css, html, LitElement, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';
import MediaControlService from '../../services/media-control-service';
import Store from '../../model/store';
import { dispatchActivePlayerId, getGroupingChanges, getGroupPlayerIds } from '../../utils/utils';
import { listStyle } from '../../constants';
import { MediaPlayer } from '../../model/media-player';
import './grouping-button';
import { CardConfig, GroupingConfig, PredefinedGroup } from '../../types';
import { GroupingItem } from '../../model/grouping-item';

export class Grouping extends LitElement {
  @property({ attribute: false }) store!: Store;
  private groupingItems!: GroupingItem[];
  private activePlayer!: MediaPlayer;
  private mediaControlService!: MediaControlService;
  private mediaPlayerIds!: string[];
  private notJoinedPlayers!: string[];
  private joinedPlayers!: string[];
  @state() modifiedItems: string[] = [];
  @state() selectedPredefinedGroup?: PredefinedGroup;
  @state() private applying = false;
  private frozenGroupingItems?: GroupingItem[];
  private config!: CardConfig;
  private groupingConfig!: GroupingConfig;

  render() {
    if (!this.applying) {
      this.config = this.store.config;
      this.groupingConfig = this.config.grouping ?? {};
      this.activePlayer = this.store.activePlayer;
      this.mediaControlService = this.store.mediaControlService;
      this.mediaPlayerIds = this.store.allMediaPlayers.map((player) => player.id);
      this.groupingItems = this.getGroupingItems();
      this.notJoinedPlayers = this.getNotJoinedPlayers();
      this.joinedPlayers = this.getJoinedPlayers();

      if (this.groupingConfig.skipApplyButton && (this.modifiedItems.length > 0 || this.selectedPredefinedGroup)) {
        this.applyGrouping();
      }
    }

    const items = this.frozenGroupingItems ?? this.groupingItems;
    const buttonFontSize = this.groupingConfig.buttonFontSize;
    return html`
      <style>
        sonos-grouping-button {
          ${buttonFontSize ? `font-size: ${buttonFontSize}rem;` : ''}
        }
      </style>
      <div class="wrapper">
        <div class="predefined-groups" compact=${this.groupingConfig.compact || nothing}>
          ${this.groupingConfig.hideUngroupAllButtons
            ? nothing
            : html`${this.renderJoinAllButton()} ${this.renderUnJoinAllButton()}`}
          ${when(this.store.predefinedGroups, () => this.renderPredefinedGroups())}
        </div>
        <div class="list">
          ${items.map((item) => {
            return html`
              <div
                class="item"
                modified=${item.isModified || nothing}
                disabled=${item.isDisabled || this.applying || nothing}
                compact=${this.groupingConfig.compact || nothing}
              >
                <ha-icon
                  class="icon"
                  selected=${item.isSelected || nothing}
                  .icon="mdi:${item.icon}"
                  @click=${() => this.toggleItem(item)}
                ></ha-icon>
                <div class="name-and-volume">
                  <span class="name">${item.name}</span>
                  ${this.groupingConfig.hideVolumes
                    ? nothing
                    : html`<sonos-volume
                        class="volume"
                        .store=${this.store}
                        .player=${item.player}
                        .updateMembers=${false}
                        .slim=${true}
                      ></sonos-volume>`}
                </div>
              </div>
            `;
          })}
        </div>
        ${this.applying ? html`<div class="applying"><ha-spinner></ha-spinner></div>` : nothing}
        <ha-control-button-group
          class="buttons"
          hide=${this.applying ||
          (this.modifiedItems.length === 0 && !this.selectedPredefinedGroup) ||
          this.groupingConfig.skipApplyButton ||
          nothing}
        >
          <ha-control-button class="apply" @click=${this.applyGrouping}>
            ${this.store.hass.localize('ui.common.apply') || 'Apply'}
          </ha-control-button>
          <ha-control-button @click=${this.cancelGrouping}>
            ${this.store.hass.localize('ui.common.cancel') || 'Cancel'}
          </ha-control-button>
        </ha-control-button-group>
      </div>
    `;
  }

  static get styles() {
    return [
      listStyle,
      css`
        :host {
          --mdc-icon-size: 24px;
        }
        .wrapper {
          display: flex;
          flex-direction: column;
          height: 100%;
          position: relative;
        }

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

        .list {
          flex: 1;
          overflow: auto;
        }

        .buttons {
          flex-shrink: 0;
          margin: 0 1rem;
          padding-top: 0.5rem;
        }

        .apply {
          --control-button-background-color: var(--accent-color);
        }

        *[hide] {
          display: none;
        }

        .name-and-volume {
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .volume {
          --accent-color: var(--secondary-text-color);
        }

        .applying {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          background: rgba(0, 0, 0, 0.3);
          z-index: 10;
          pointer-events: none;
        }
      `,
    ];
  }

  toggleItem(item: GroupingItem) {
    if (item.isDisabled || this.applying) {
      return;
    }
    this.toggleItemWithoutDisabledCheck(item);
  }

  private toggleItemWithoutDisabledCheck(item: GroupingItem) {
    if (this.modifiedItems.includes(item.player.id)) {
      this.modifiedItems = this.modifiedItems.filter((id) => id !== item.player.id);
    } else {
      this.modifiedItems = [...this.modifiedItems, item.player.id];
    }
    this.selectedPredefinedGroup = undefined;
  }

  async applyGrouping() {
    if (this.applying) {
      return;
    }
    const groupingItems = this.groupingItems;
    const joinedPlayers = this.joinedPlayers;
    const activePlayerId = this.activePlayer.id;
    const { unJoin, join, newMainPlayer } = getGroupingChanges(groupingItems, joinedPlayers, activePlayerId);
    const selectedPredefinedGroup = this.selectedPredefinedGroup;
    const expectedGroupIds = groupingItems
      .filter((item) => item.isSelected)
      .map((item) => item.player.id)
      .sort();

    // Snapshot the intended end-state to freeze the UI during apply
    this.frozenGroupingItems = groupingItems.map((item) => {
      const snapshot = new GroupingItem(item.player, this.activePlayer, item.isModified);
      snapshot.isSelected = item.isSelected;
      return snapshot;
    });
    this.applying = true;
    this.modifiedItems = [];
    this.selectedPredefinedGroup = undefined;

    try {
      if (join.length > 0) {
        await this.mediaControlService.join(newMainPlayer, join);
      }
      if (unJoin.length > 0) {
        await this.mediaControlService.unJoin(unJoin);
      }
      if (selectedPredefinedGroup) {
        await this.mediaControlService.activatePredefinedGroup(selectedPredefinedGroup);
      }

      if (newMainPlayer !== activePlayerId && !this.groupingConfig.dontSwitchPlayer) {
        dispatchActivePlayerId(newMainPlayer, this.config, this);
      }
      if (this.config.entityId && unJoin.includes(this.config.entityId) && this.groupingConfig.dontSwitchPlayer) {
        dispatchActivePlayerId(this.config.entityId, this.config, this);
      }

      // Poll until HA state matches the expected group, or timeout
      // Then wait for HA to fully reconcile all entity states
      await this.waitForGroupSync(newMainPlayer, expectedGroupIds);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } finally {
      this.applying = false;
      this.frozenGroupingItems = undefined;
    }
  }

  private waitForGroupSync(mainPlayerId: string, expectedGroupIds: string[]): Promise<void> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        clearInterval(poll);
        resolve();
      }, 30_000);

      const poll = setInterval(() => {
        if (this.isGroupingSynced(mainPlayerId, expectedGroupIds)) {
          clearInterval(poll);
          clearTimeout(timeout);
          resolve();
        }
      }, 500);
    });
  }

  private isGroupingSynced(mainPlayerId: string, expectedGroupIds: string[]): boolean {
    const hass = this.store.hass;
    const mainEntity = hass.states[mainPlayerId];
    if (!mainEntity) {
      return false;
    }
    const actualIds = getGroupPlayerIds(mainEntity).sort();
    return (
      actualIds.length === expectedGroupIds.length && actualIds.every((id, index) => id === expectedGroupIds[index])
    );
  }

  private cancelGrouping() {
    if (this.applying) {
      return;
    }
    this.modifiedItems = [];
  }

  private getGroupingItems() {
    const groupingItems = this.store.allMediaPlayers.map(
      (player) => new GroupingItem(player, this.activePlayer, this.modifiedItems.includes(player.id)),
    );
    const selectedItems = groupingItems.filter((item) => item.isSelected);
    if (selectedItems.length === 1) {
      selectedItems[0].isDisabled = true;
    }
    if (this.groupingConfig.disableMainSpeakers) {
      const mainSpeakerIds = this.store.allGroups
        .filter((player) => player.members.length > 1)
        .map((player) => player.id);
      groupingItems.forEach((item) => {
        if (mainSpeakerIds.includes(item.player.id)) {
          item.isDisabled = true;
        }
      });
    }
    if (!this.groupingConfig.dontSortMembersOnTop) {
      groupingItems.sort((a, b) => {
        // Main player always first
        if (a.isMain) {
          return -1;
        }
        if (b.isMain) {
          return 1;
        }
        // Currently joined members stay at top (regardless of pending changes)
        if (a.currentlyJoined && !b.currentlyJoined) {
          return -1;
        }
        if (b.currentlyJoined && !a.currentlyJoined) {
          return 1;
        }
        return 0;
      });
    }
    return groupingItems;
  }

  private renderJoinAllButton() {
    const icon = this.groupingConfig.buttonIcons?.joinAll ?? 'mdi:checkbox-multiple-marked-outline';
    return when(this.notJoinedPlayers.length, () => this.groupingButton(icon, this.selectAll));
  }

  private groupingButton(icon: string, click: () => void) {
    return html`
      <sonos-grouping-button
        @click=${click}
        .icon=${icon}
        .buttonColor=${this.groupingConfig.buttonColor}
      ></sonos-grouping-button>
    `;
  }

  private getNotJoinedPlayers() {
    return this.mediaPlayerIds.filter(
      (playerId) => playerId !== this.activePlayer.id && !this.activePlayer.hasMember(playerId),
    );
  }

  private renderUnJoinAllButton() {
    const icon = this.groupingConfig.buttonIcons?.unJoinAll ?? 'mdi:minus-box-multiple-outline';
    return when(this.joinedPlayers.length, () => this.groupingButton(icon, this.deSelectAll));
  }

  private getJoinedPlayers() {
    return this.mediaPlayerIds.filter(
      (playerId) => playerId === this.activePlayer.id || this.activePlayer.hasMember(playerId),
    );
  }

  private renderPredefinedGroups() {
    return this.store.predefinedGroups.map((predefinedGroup) => {
      return html`
        <sonos-grouping-button
          @click=${async () => this.selectPredefinedGroup(predefinedGroup)}
          .icon=${this.groupingConfig.buttonIcons?.predefinedGroup ?? 'mdi:speaker-multiple'}
          .name=${predefinedGroup.name}
          .selected=${this.selectedPredefinedGroup?.name === predefinedGroup.name}
          .buttonColor=${this.groupingConfig.buttonColor}
        ></sonos-grouping-button>
      `;
    });
  }

  private async selectPredefinedGroup(predefinedGroup: PredefinedGroup) {
    let hasGroupingChanges = false;
    this.groupingItems.forEach((item) => {
      const inPG = predefinedGroup.entities.some((pgp) => pgp.player.id === item.player.id);
      if ((inPG && !item.isSelected) || (!inPG && item.isSelected)) {
        this.toggleItemWithoutDisabledCheck(item);
        hasGroupingChanges = true;
      }
    });
    this.selectedPredefinedGroup = predefinedGroup;

    if (!hasGroupingChanges && this.groupingConfig.skipApplyButton) {
      await this.mediaControlService.activatePredefinedGroup(predefinedGroup);
      this.selectedPredefinedGroup = undefined;
    }
  }

  private selectAll() {
    this.groupingItems.forEach((item) => {
      if (!item.isSelected) {
        this.toggleItem(item);
      }
    });
  }

  private deSelectAll() {
    this.groupingItems.forEach((item) => {
      if ((!item.isMain && item.isSelected) || (item.isMain && !item.isSelected)) {
        this.toggleItem(item);
      }
    });
  }
}
