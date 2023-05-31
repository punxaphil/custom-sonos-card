import { HomeAssistant } from 'custom-card-helpers';
import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';
import MediaControlService from '../services/media-control-service';
import Store from '../store';
import { CardConfig, PlayerGroups } from '../types';
import { dispatchActiveEntity, getEntityName, listStyle } from '../utils';
import { getButton } from '../components/button';
import { styleMap } from 'lit-html/directives/style-map.js';

export class Grouping extends LitElement {
  @property() store!: Store;
  private hass!: HomeAssistant;
  private config!: CardConfig;
  private entityId!: string;
  private mediaControlService!: MediaControlService;
  private groups!: PlayerGroups;
  private mediaPlayers!: string[];

  render() {
    ({
      config: this.config,
      hass: this.hass,
      groups: this.groups,
      entityId: this.entityId,
      mediaControlService: this.mediaControlService,
      mediaPlayers: this.mediaPlayers,
    } = this.store);
    const joinedPlayers = this.mediaPlayers.filter(
      (player) => player !== this.entityId && this.groups[this.entityId].members[player],
    );
    const notJoinedPlayers = this.mediaPlayers.filter(
      (player) => player !== this.entityId && !this.groups[this.entityId].members[player],
    );
    return html`
      <div style=${buttonsStyle()}>
        ${when(notJoinedPlayers.length, () => {
          const click = async () => await this.mediaControlService.join(this.entityId, notJoinedPlayers);
          return getButton(click, 'mdi:checkbox-multiple-marked-outline', '');
        })}
        ${when(joinedPlayers.length, () => {
          const click = async () => await this.mediaControlService.unjoin(joinedPlayers);
          return getButton(click, 'mdi:minus-box-multiple-outline', '');
        })}
        ${when(this.config.predefinedGroups && true, () => this.renderPredefinedGroups())}
      </div>
      <mwc-list multi style="${listStyle()}">
        ${this.mediaPlayers
          .map((entity) => this.getGroupingItem(entity))
          .map((groupingItem) => {
            return html`<mwc-list-item
              ?activated="${groupingItem.isSelected}"
              ?disabled="${groupingItem.isSelected && !groupingItem.isGrouped}"
              @click="${async () => await this.itemClickAction(groupingItem)}"
            >
              <ha-icon
                .icon="${groupingItem.isSelected ? 'mdi:checkbox-marked-outline' : 'mdi:checkbox-blank-outline'}"
              ></ha-icon>
              <span style=${itemStyle()}>${groupingItem.name}</span>
            </mwc-list-item>`;
          })}
      </mwc-list>
    `;
  }

  private getGroupingItem(entity: string): GroupingItem {
    const isMain = entity === this.entityId;
    const members = this.groups[this.entityId].members;
    return {
      isMain,
      isSelected: isMain || members[entity] !== undefined,
      isGrouped: Object.keys(members).length > 0,
      name: getEntityName(this.hass, this.config, entity),
      entity: entity,
    };
  }
  private async itemClickAction({ isSelected, entity, isMain }: GroupingItem) {
    if (isSelected) {
      if (isMain) {
        const firstMemberEntityId = Object.keys(this.groups[this.entityId].members)[0];
        dispatchActiveEntity(firstMemberEntityId);
      }
      await this.mediaControlService.unjoin([entity]);
    } else {
      await this.mediaControlService.join(this.entityId, [entity]);
    }
  }

  private renderPredefinedGroups() {
    return this.config.predefinedGroups
      ?.filter((group) => group.entities.length > 1)
      .map((group) => {
        const click = async () => await this.mediaControlService.createGroup(group.entities, this.groups);
        return getButton(click, 'mdi:speaker-multiple', group.name);
      });
  }
}

function buttonsStyle() {
  return styleMap({
    margin: '1rem',
    display: ' flex',
    flexWrap: 'wrap',
    gap: '1rem',
    justifyContent: 'center',
  });
}

function itemStyle() {
  return styleMap({ color: 'var(--secondary-text-color)', fontWeight: 'bold' });
}

interface GroupingItem {
  isMain: boolean;
  isSelected: boolean;
  isGrouped: boolean;
  name: string;
  entity: string;
}
