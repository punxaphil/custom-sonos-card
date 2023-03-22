import { HomeAssistant } from 'custom-card-helpers';
import { html, LitElement } from 'lit';
import { StyleInfo } from 'lit-html/development/directives/style-map';
import { property } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';
import MediaControlService from '../services/media-control-service';
import { titleStyle } from '../sharedStyle';
import Store from '../store';
import { CardConfig, PlayerGroups } from '../types';
import { getEntityName, listenForEntityId, listStyle, sharedStyle, stopListeningForEntityId, stylable } from '../utils';

export class Grouping extends LitElement {
  @property() store!: Store;
  private hass!: HomeAssistant;
  private config!: CardConfig;
  private entityId!: string;
  private mediaControlService!: MediaControlService;
  private groups!: PlayerGroups;
  private mediaPlayers!: string[];

  entityIdListener = (event: Event) => {
    this.entityId = (event as CustomEvent).detail.entityId;
  };

  connectedCallback() {
    super.connectedCallback();
    listenForEntityId(this.entityIdListener);
  }

  disconnectedCallback() {
    stopListeningForEntityId(this.entityIdListener);
    super.disconnectedCallback();
  }

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
      <div style="${stylable('title', this.config, titleStyle)}">
        ${this.config.groupingTitle ? this.config.groupingTitle : html`<ha-icon .icon=${'mdi:cast-variant'}></ha-icon>`}
      </div>
      <mwc-list multi style="${listStyle(this.config)}">
        ${this.mediaPlayers
          .map((entity) => this.getGroupingItem(entity))
          .map((groupingItem) => {
            return html`<mwc-list-item
              ?activated="${groupingItem.isMember}"
              ?disabled="${groupingItem.isMain}"
              @click="${!groupingItem.isMain && this.itemClickAction(groupingItem)}"
            >
              <ha-icon
                .icon="${groupingItem.isMember ? 'mdi:checkbox-marked-outline' : 'mdi:checkbox-blank-outline'}"
              ></ha-icon>
              <span>${groupingItem.name}</span>
            </mwc-list-item>`;
          })}
      </mwc-list>

      ${when(notJoinedPlayers.length, () => {
        return this.getButton(
          async () => await this.mediaControlService.join(this.entityId, notJoinedPlayers),
          'mdi:checkbox-multiple-marked-outline',
          '',
        );
      })}
      ${when(joinedPlayers.length, () =>
        this.getButton(
          async () => await this.mediaControlService.unjoin(joinedPlayers),
          'mdi:minus-box-multiple-outline',
          '',
        ),
      )}
      ${when(this.config.predefinedGroups && true, () => this.renderPredefinedGroups())}
    `;
  }

  private getGroupingItem(entity: string): GroupingItem {
    const isMain = entity === this.entityId;
    return {
      isMain,
      isMember: isMain || !!this.groups[this.entityId].members[entity],
      name: getEntityName(this.hass, this.config, entity),
      entity: entity,
    };
  }
  private itemClickAction({ isMain, isMember, entity }: GroupingItem) {
    if (isMain) {
      return async () => await this.mediaControlService.unjoin([entity]);
    } else if (isMember) {
      return async () => await this.mediaControlService.unjoin([entity]);
    } else {
      return async () => await this.mediaControlService.join(this.entityId, [entity]);
    }
  }

  private renderPredefinedGroups() {
    return html`
      <div>
        ${this.config.predefinedGroups
          ?.filter((group) => group.entities.length > 1)
          .map((group) => {
            return this.getButton(
              async () => await this.mediaControlService.createGroup(group.entities, this.groups),
              'mdi:speaker-multiple',
              group.name,
              { fontStyle: 'italic' },
            );
          })}
      </div>
    `;
  }

  private getButton(click: () => void, icon: string, name: string, additionalStyle?: StyleInfo) {
    return html`
      <mwc-button @click="${click}" style="${this.buttonStyle(additionalStyle)}" outlined>
        ${name ? html`<span style="${this.buttonNameStyle()}">${name}</span>` : ''}
        <ha-icon .icon=${icon} style="${this.buttonIconStyle()}"></ha-icon>
      </mwc-button>
    `;
  }

  private buttonStyle(additionalStyle?: StyleInfo) {
    return stylable('member', this.config, {
      borderRadius: 'var(--sonos-int-border-radius)',
      margin: '0.5rem',
      justifyContent: 'center',
      backgroundColor: 'var(--sonos-int-background-color)',
      '--mdc-button-outline-width': '2px',
      '--mdc-button-outline-color': 'var(--mdc-theme-primary)',
      ...additionalStyle,
    });
  }

  private buttonNameStyle() {
    return stylable('member-name', this.config, {
      alignSelf: 'center',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    });
  }

  private buttonIconStyle() {
    return stylable('member-icon', this.config, {
      alignSelf: 'center',
      '--mdc-icon-size': '20px',
      paddingLeft: '0.1rem',
    });
  }

  static get styles() {
    return sharedStyle;
  }
}

interface GroupingItem {
  isMain: boolean;
  isMember: boolean;
  name: string;
  entity: string;
}
