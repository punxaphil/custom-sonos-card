import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';
import MediaControlService from '../services/media-control-service';
import Store from '../model/store';
import { dispatchActivePlayerId } from '../utils/utils';
import { listStyle } from '../constants';
import { MediaPlayer } from '../model/media-player';
import '../components/grouping-button';

export class Grouping extends LitElement {
  @property({attribute: false}) store!: Store;
  private activePlayer!: MediaPlayer;
  private mediaControlService!: MediaControlService;
  private allGroups!: MediaPlayer[];
  private mediaPlayerIds!: string[];

  render() {
    this.activePlayer = this.store.activePlayer;
    this.allGroups = this.store.allGroups;
    this.mediaControlService = this.store.mediaControlService;
    this.mediaPlayerIds = this.store.allMediaPlayers.map((player) => player.id);
    return html`
      <div class="buttons">
        ${this.renderJoinAllButton()} ${this.renderUnJoinAllButton()}
        ${when(this.store.predefinedGroups, () => this.renderPredefinedGroups())}
      </div>
      <mwc-list multi class="list">
        ${this.getGroupingItems().map(({ icon, isSelected, player, isDisabled, isMain, name }) => {
          return html`
            <mwc-list-item
              ?activated="${isSelected}"
              ?disabled="${isDisabled}"
              @click="${() => this.itemClick(isSelected, isMain, player)}"
            >
              <ha-icon .icon="mdi:checkbox-${icon}-outline"></ha-icon>
              <span class="item">${name}</span>
            </mwc-list-item>
          `;
        })}
      </mwc-list>
    `;
  }

  async itemClick(isSelected: boolean, isMain: boolean, player: MediaPlayer) {
    if (isSelected) {
      if (isMain) {
        dispatchActivePlayerId(player.id);
      }
      await this.mediaControlService.unJoin([player.id]);
    } else {
      await this.mediaControlService.join(this.activePlayer.id, [player.id]);
    }
  }

  private getGroupingItems() {
    return this.store.allMediaPlayers.map((player) => new GroupingItem(player, this.activePlayer));
  }

  private renderJoinAllButton() {
    const notJoinedPlayers = this.getNotJoinedPlayers();
    return when(notJoinedPlayers.length, () => {
      return html`
        <sonos-grouping-button
          @click=${async () => await this.mediaControlService.join(this.activePlayer.id, notJoinedPlayers)}
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
    const joinedPlayers = this.getJoinedPlayers();
    return when(joinedPlayers.length, () => {
      return html`
        <sonos-grouping-button
          @click=${async () => await this.mediaControlService.unJoin(joinedPlayers)}
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
  static get styles() {
    return [
      css`
        :host {
          --mdc-icon-size: 24px;
        }

        .buttons {
          margin: 1rem;
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          justify-content: center;
        }

        .item {
          color: var(--secondary-text-color);
          font-weight: bold;
        }
      `,
      listStyle,
    ];
  }
}

class GroupingItem {
  readonly isSelected: boolean;
  readonly icon: string;
  readonly isDisabled: boolean;
  readonly name: string;
  readonly isMain: boolean;
  readonly player: MediaPlayer;

  constructor(player: MediaPlayer, activePlayer: MediaPlayer) {
    this.isMain = player.id === activePlayer.id;
    this.isSelected = this.isMain || activePlayer.hasMember(player.id);
    this.player = player;
    this.icon = this.isSelected ? 'marked' : 'blank';
    this.isDisabled = this.isSelected && !activePlayer.isGrouped();
    this.name = player.name;
  }
}
