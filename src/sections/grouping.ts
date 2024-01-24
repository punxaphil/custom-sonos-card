import { css, html, LitElement, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';
import MediaControlService from '../services/media-control-service';
import Store from '../model/store';
import { dispatchActivePlayerId } from '../utils/utils';
import { listStyle } from '../constants';
import { MediaPlayer } from '../model/media-player';
import '../components/grouping-button';

export class Grouping extends LitElement {
  @property({ attribute: false }) store!: Store;
  @state() groupingItems!: GroupingItem[];
  private originalGroupingItems!: GroupingItem[];
  private activePlayer!: MediaPlayer;
  private mediaControlService!: MediaControlService;
  private allGroups!: MediaPlayer[];
  private mediaPlayerIds!: string[];
  private notJoinedPlayers!: string[];
  private joinedPlayers!: string[];

  render() {
    if (!this.groupingItems) {
      this.activePlayer = this.store.activePlayer;
      this.allGroups = this.store.allGroups;
      this.mediaControlService = this.store.mediaControlService;
      this.mediaPlayerIds = this.store.allMediaPlayers.map((player) => player.id);
      this.groupingItems = this.getGroupingItems();
      this.originalGroupingItems = this.getGroupingItems();
      this.notJoinedPlayers = this.getNotJoinedPlayers();
      this.joinedPlayers = this.getJoinedPlayers();
    }

    return html`
      <div class="wrapper">
        <div class="predefined-groups">
          ${this.renderJoinAllButton()} ${this.renderUnJoinAllButton()}
          ${when(this.store.predefinedGroups, () => this.renderPredefinedGroups())}
        </div>
        <div class="list">
          ${this.groupingItems.map((item) => {
            return html`
              <div class="item" modified="${item.isModified() || nothing}" disabled="${item.isDisabled || nothing}">
                <ha-icon
                  class="icon"
                  selected="${item.isSelected || nothing}"
                  .icon="mdi:${item.icon}"
                  @click="${() => this.itemClick(item)}"
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
        <ha-control-button-group class="buttons" hide=${this.isGroupingModified() || nothing}>
          <ha-control-button class="apply" @click="${this.applyGrouping}"> Apply </ha-control-button>
          <ha-control-button @click="${this.cancelGrouping}"> Cancel </ha-control-button>
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

        .item {
          color: var(--secondary-text-color);
          padding: 0.5rem;
          display: flex;
          align-items: center;
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

  async itemClick(item: GroupingItem) {
    if (!item.isDisabled) {
      item.toggle();
      const selectedItems = this.groupingItems.filter((item) => {
        item.isDisabled = false;
        return item.isSelected;
      });
      if (selectedItems.length === 1) {
        selectedItems[0].isDisabled = true;
      }
      this.requestUpdate();
    }
  }

  private isGroupingModified() {
    return JSON.stringify(this.groupingItems) === JSON.stringify(this.originalGroupingItems);
  }

  async applyGrouping() {
    const isSelected = this.groupingItems.filter((item) => item.isSelected);
    const unjoin = this.groupingItems
      .filter((item) => !item.isSelected && this.joinedPlayers.includes(item.player.id))
      .map((item) => item.player.id);
    const join = this.groupingItems
      .filter((item) => item.isSelected && !this.joinedPlayers.includes(item.player.id))
      .map((item) => item.player.id);
    let main = this.activePlayer.id;
    if (unjoin.includes(main)) {
      main = isSelected[0].player.id;
      dispatchActivePlayerId(main);
    }
    if (unjoin.length) {
      await this.mediaControlService.unJoin(unjoin);
    }
    if (join.length) {
      await this.mediaControlService.join(main, join);
    }
  }

  private cancelGrouping() {
    this.groupingItems = this.getGroupingItems();
  }

  private getGroupingItems() {
    return this.store.allMediaPlayers.map((player) => new GroupingItem(player, this.activePlayer));
  }

  private renderJoinAllButton() {
    return when(this.notJoinedPlayers.length, () => {
      return html`
        <sonos-grouping-button
          @click=${async () => await this.mediaControlService.join(this.activePlayer.id, this.notJoinedPlayers)}
          .icon=${'mdi:checkbox-multiple-marked-outline'}
        ></sonos-grouping-button>
      `;
    });
  }

  private getNotJoinedPlayers() {
    return this.mediaPlayerIds.filter(
      (playerId) => playerId !== this.activePlayer.id && !this.activePlayer.hasMember(playerId),
    );
  }

  private renderUnJoinAllButton() {
    return when(this.joinedPlayers.length, () => {
      return html`
        <sonos-grouping-button
          @click=${async () => await this.mediaControlService.unJoin(this.joinedPlayers)}
          .icon=${'mdi:minus-box-multiple-outline'}
        ></sonos-grouping-button>
      `;
    });
  }

  private getJoinedPlayers() {
    return this.mediaPlayerIds.filter(
      (playerId) => playerId !== this.activePlayer.id && this.activePlayer.hasMember(playerId),
    );
  }

  private renderPredefinedGroups() {
    return this.store.predefinedGroups.map((predefinedGroup) => {
      return html`
        <sonos-grouping-button
          @click=${async () => await this.mediaControlService.createGroup(predefinedGroup, this.allGroups)}
          .icon=${'mdi:speaker-multiple'}
          .name=${predefinedGroup.name}
        ></sonos-grouping-button>
      `;
    });
  }
}

class GroupingItem {
  isSelected: boolean;
  icon!: string;
  isDisabled: boolean;
  readonly name: string;
  readonly isMain: boolean;
  readonly player: MediaPlayer;
  readonly originalState: boolean;

  constructor(player: MediaPlayer, activePlayer: MediaPlayer) {
    this.isMain = player.id === activePlayer.id;
    this.isSelected = this.isMain || activePlayer.hasMember(player.id);
    this.originalState = this.isSelected;
    this.player = player;

    this.isDisabled = this.isSelected && !activePlayer.isGrouped();
    this.name = player.name;
    this.updateIcon();
  }

  toggle() {
    this.isSelected = !this.isSelected;
    this.updateIcon();
  }

  isModified() {
    return this.isSelected !== this.originalState;
  }

  private updateIcon() {
    this.icon = this.isSelected ? 'check-circle' : 'checkbox-blank-circle-outline';
  }
}
