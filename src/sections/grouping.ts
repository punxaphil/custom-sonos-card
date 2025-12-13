import { css, html, LitElement, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';
import MediaControlService from '../services/media-control-service';
import Store from '../model/store';
import { dispatchActivePlayerId, getGroupingChanges } from '../utils/utils';
import { listStyle } from '../constants';
import { MediaPlayer } from '../model/media-player';
import '../components/grouping-button';
import { CardConfig, PredefinedGroup } from '../types';
import { GroupingItem } from '../model/grouping-item';

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
  private config!: CardConfig;

  render() {
    this.config = this.store.config;
    this.activePlayer = this.store.activePlayer;
    this.mediaControlService = this.store.mediaControlService;
    this.mediaPlayerIds = this.store.allMediaPlayers.map((player) => player.id);
    this.groupingItems = this.getGroupingItems();
    this.notJoinedPlayers = this.getNotJoinedPlayers();
    this.joinedPlayers = this.getJoinedPlayers();

    if (this.config.groupingSkipApplyButton && (this.modifiedItems.length > 0 || this.selectedPredefinedGroup)) {
      this.applyGrouping();
    }

    const buttonColor = this.config.groupingButtonColor;
    const buttonFontSize = this.config.groupingButtonFontSize;
    return html`
      <style>
        sonos-grouping-button {
          ${buttonColor ? `--accent-color: ${buttonColor};` : ''}
          ${buttonFontSize ? `font-size: ${buttonFontSize}rem;` : ''}
        }
      </style>
      <div class="wrapper">
        <div class="predefined-groups" compact=${this.config.groupingCompact || nothing}>
          ${this.config.groupingHideUngroupAllButtons
            ? nothing
            : html`${this.renderJoinAllButton()} ${this.renderUnJoinAllButton()}`}
          ${when(this.store.predefinedGroups, () => this.renderPredefinedGroups())}
        </div>
        <div class="list">
          ${this.groupingItems.map((item) => {
            return html`
              <div
                class="item"
                modified=${item.isModified || nothing}
                disabled=${item.isDisabled || nothing}
                compact=${this.config.groupingCompact || nothing}
              >
                <ha-icon
                  class="icon"
                  selected=${item.isSelected || nothing}
                  .icon="mdi:${item.icon}"
                  @click=${() => this.toggleItem(item)}
                ></ha-icon>
                <div class="name-and-volume">
                  <span class="name">${item.name}</span>
                  <sonos-volume
                    class="volume"
                    .store=${this.store}
                    .player=${item.player}
                    .updateMembers=${false}
                    .slim=${true}
                  ></sonos-volume>
                </div>
              </div>
            `;
          })}
        </div>
        <ha-control-button-group
          class="buttons"
          hide=${(this.modifiedItems.length === 0 && !this.selectedPredefinedGroup) ||
          this.config.groupingSkipApplyButton ||
          nothing}
        >
          <ha-control-button class="apply" @click=${this.applyGrouping}> Apply</ha-control-button>
          <ha-control-button @click=${this.cancelGrouping}> Cancel</ha-control-button>
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
          padding-top: 0rem;
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
      `,
    ];
  }

  toggleItem(item: GroupingItem) {
    if (item.isDisabled) {
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
    const groupingItems = this.groupingItems;
    const joinedPlayers = this.joinedPlayers;
    const activePlayerId = this.activePlayer.id;
    const { unJoin, join, newMainPlayer } = getGroupingChanges(groupingItems, joinedPlayers, activePlayerId);
    this.modifiedItems = [];
    const selectedPredefinedGroup = this.selectedPredefinedGroup;
    this.selectedPredefinedGroup = undefined;

    if (join.length > 0) {
      await this.mediaControlService.join(newMainPlayer, join);
    }
    if (unJoin.length > 0) {
      await this.mediaControlService.unJoin(unJoin);
    }
    if (selectedPredefinedGroup) {
      await this.mediaControlService.activatePredefinedGroup(selectedPredefinedGroup);
    }

    if (newMainPlayer !== activePlayerId && !this.config.groupingDontSwitchPlayer) {
      dispatchActivePlayerId(newMainPlayer, this.config, this);
    }
    if (this.config.entityId && unJoin.includes(this.config.entityId) && this.config.groupingDontSwitchPlayer) {
      dispatchActivePlayerId(this.config.entityId, this.config, this);
    }
  }

  private cancelGrouping() {
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
    if (this.config.groupingDisableMainSpeakers) {
      const mainSpeakerIds = this.store.allGroups
        .filter((player) => player.members.length > 1)
        .map((player) => player.id);
      groupingItems.forEach((item) => {
        if (mainSpeakerIds.includes(item.player.id)) {
          item.isDisabled = true;
        }
      });
    }
    if (!this.config.groupingDontSortMembersOnTop) {
      groupingItems.sort((a, b) => {
        if ((a.isMain && !b.isMain) || (a.isSelected && !a.isModified && !b.isSelected)) {
          return -1;
        }
        return 0;
      });
    }
    return groupingItems;
  }

  private renderJoinAllButton() {
    const icon = this.config.groupingButtonIcons?.joinAll ?? 'mdi:checkbox-multiple-marked-outline';
    return when(this.notJoinedPlayers.length, () => this.groupingButton(icon, this.selectAll));
  }

  private groupingButton(icon: string, click: () => void) {
    return html` <sonos-grouping-button @click=${click} .icon=${icon}></sonos-grouping-button> `;
  }

  private getNotJoinedPlayers() {
    return this.mediaPlayerIds.filter(
      (playerId) => playerId !== this.activePlayer.id && !this.activePlayer.hasMember(playerId),
    );
  }

  private renderUnJoinAllButton() {
    const icon = this.config.groupingButtonIcons?.unJoinAll ?? 'mdi:minus-box-multiple-outline';
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
          .icon=${this.config.groupingButtonIcons?.predefinedGroup ?? 'mdi:speaker-multiple'}
          .name=${predefinedGroup.name}
          .selected=${this.selectedPredefinedGroup?.name === predefinedGroup.name}
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

    if (!hasGroupingChanges && this.config.groupingSkipApplyButton) {
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
