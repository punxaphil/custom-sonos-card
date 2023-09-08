import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';
import MediaControlService from '../services/media-control-service';
import Store from '../model/store';
import { dispatchActivePlayerId } from '../utils/utils';
import { getButton } from '../components/button';
import { listStyle } from '../constants';
import { MediaPlayer } from '../model/media-player';

export class Grouping extends LitElement {
  @property() store!: Store;
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
        ${this.store.allMediaPlayers
          .map((player) => this.getGroupingItem(player))
          .map((groupingItem) => {
            return html`
              <mwc-list-item
                ?activated="${groupingItem.isSelected}"
                ?disabled="${groupingItem.isSelected && !groupingItem.isGrouped}"
                @click="${async () => await this.itemClickAction(groupingItem)}"
              >
                <ha-icon
                  .icon="${groupingItem.isSelected ? 'mdi:checkbox-marked-outline' : 'mdi:checkbox-blank-outline'}"
                ></ha-icon>
                <span class="item">${groupingItem.player.name}</span>
              </mwc-list-item>
            `;
          })}
      </mwc-list>
    `;
  }

  private renderJoinAllButton() {
    const notJoinedPlayers = this.getNotJoinedPlayers();
    return when(notJoinedPlayers.length, () => {
      const click = async () => await this.mediaControlService.join(this.activePlayer.id, notJoinedPlayers);
      return getButton(click, 'mdi:checkbox-multiple-marked-outline', '');
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
      const click = async () => await this.mediaControlService.unJoin(joinedPlayers);
      return getButton(click, 'mdi:minus-box-multiple-outline', '');
    });
  }

  private getJoinedPlayers() {
    return this.mediaPlayerIds.filter(
      (playerId) => playerId !== this.activePlayer.id && this.activePlayer.hasMember(playerId),
    );
  }

  private getGroupingItem(player: MediaPlayer): GroupingItem {
    const isMain = player.id === this.activePlayer.id;
    return {
      isMain,
      isSelected: isMain || this.activePlayer.hasMember(player.id),
      isGrouped: this.activePlayer.isGrouped(),
      player: player,
    };
  }
  private async itemClickAction({ isSelected, player, isMain }: GroupingItem) {
    if (isSelected) {
      if (isMain) {
        dispatchActivePlayerId(this.activePlayer.id);
      }
      await this.mediaControlService.unJoin([player.id]);
    } else {
      await this.mediaControlService.join(this.activePlayer.id, [player.id]);
    }
  }

  private renderPredefinedGroups() {
    return this.store.predefinedGroups
      ?.filter((group) => group.entities.length > 1)
      .map((group) => {
        const click = async () => await this.mediaControlService.createGroup(group.entities, this.allGroups);
        return getButton(click, 'mdi:speaker-multiple', group.name);
      });
  }
  static get styles() {
    return [
      css`
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

interface GroupingItem {
  isMain: boolean;
  isSelected: boolean;
  isGrouped: boolean;
  player: MediaPlayer;
}
