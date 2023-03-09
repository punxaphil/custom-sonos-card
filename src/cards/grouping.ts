import { HomeAssistant } from 'custom-card-helpers';
import { css, html, LitElement } from 'lit';
import { StyleInfo } from 'lit-html/development/directives/style-map';
import { property } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';
import MediaControlService from '../services/media-control-service';
import { titleStyle } from '../sharedStyle';
import Store from '../store';
import { CardConfig, PlayerGroups } from '../types';
import {
  getEntityName,
  listenForEntityId,
  sharedStyle,
  stopListeningForEntityId,
  stylable,
  validateConfig,
} from '../utils';

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

  setConfig(config: CardConfig) {
    const parsed = JSON.parse(JSON.stringify(config));
    validateConfig(parsed);
    this.config = parsed;
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
        ${this.config.groupingTitle ? this.config.groupingTitle : 'Grouping'}
      </div>
      <div style="${this.membersStyle()}">
        ${this.entityId && this.mediaPlayers.map((entity) => this.renderMediaPlayerGroupButton(entity, joinedPlayers))}
        ${when(notJoinedPlayers.length, () => {
          return this.getButton(
            async () => await this.mediaControlService.join(this.entityId, notJoinedPlayers),
            'mdi:checkbox-multiple-marked-outline',
            '',
            false,
          );
        })}
        ${when(joinedPlayers.length, () =>
          this.getButton(
            async () => await this.mediaControlService.unjoin(joinedPlayers),
            'mdi:minus-box-multiple-outline',
            '',
            false,
          ),
        )}
        ${when(this.config.predefinedGroups && this.config.predefinedGroupsNoSeparateSection, () =>
          this.renderPredefinedGroups(),
        )}
      </div>
      ${when(
        this.config.predefinedGroups && !this.config.predefinedGroupsNoSeparateSection,
        () =>
          html`<div style="${stylable('title', this.config, titleStyle)}">
              ${this.config.predefinedGroupsTitle ? this.config.predefinedGroupsTitle : 'Predefined groups'}
            </div>
            <div style="${this.membersStyle()}">${this.renderPredefinedGroups()}</div>`,
      )}
    `;
  }

  private renderMediaPlayerGroupButton(entity: string, joinedPlayers: string[]) {
    const name = getEntityName(this.hass, this.config, entity);
    if (entity === this.entityId) {
      return this.getButton(async () => await this.mediaControlService.unjoin([entity]), 'mdi:speaker', name, true);
    } else if (this.groups[this.entityId].members[entity] || (entity === this.entityId && joinedPlayers.length > 0)) {
      return this.getButton(async () => await this.mediaControlService.unjoin([entity]), 'mdi:minus', name, false, {
        '--mdc-theme-primary': 'var(--sonos-int-accent-color)',
      });
    } else {
      return this.getButton(
        async () => await this.mediaControlService.join(this.entityId, [entity]),
        'mdi:plus',
        name,
        false,
      );
    }
  }

  private renderPredefinedGroups() {
    return html`
      ${this.config.predefinedGroups
        ?.filter((group) => group.entities.length > 1)
        .map((group) => {
          return this.getButton(
            async () => await this.mediaControlService.createGroup(group.entities, this.groups),
            this.config.predefinedGroupsNoSeparateSection ? 'mdi:speaker-multiple' : '',
            group.name,
            false,
            this.config.predefinedGroupsNoSeparateSection ? { fontStyle: 'italic' } : {},
          );
        })}
    `;
  }

  private getButton(click: () => void, icon: string, name: string, disabled: boolean, additionalStyle?: StyleInfo) {
    return html`
      <mwc-button
        @click="${click}"
        style="${this.memberStyle(additionalStyle)}"
        .raised=${icon !== 'mdi:minus'}
        .unelevated=${icon === 'mdi:minus'}
        .disabled=${disabled}
      >
        ${name ? html`<span style="${this.nameStyle()}">${name}</span>` : ''}
        <ha-icon .icon=${icon} style="${this.iconStyle()}"></ha-icon>
      </mwc-button>
    `;
  }

  private membersStyle() {
    return stylable('members', this.config, {
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: '0.5rem',
      margin: '0.5rem',
    });
  }

  private memberStyle(additionalStyle?: StyleInfo) {
    return stylable('member', this.config, {
      flexGrow: '1',
      borderRadius: 'var(--sonos-int-border-radius)',
      display: 'flex',
      justifyContent: 'center',
      backgroundColor: 'var(--sonos-int-background-color)',
      maxWidth: 'calc(100% - 1.4rem)',
      ...additionalStyle,
    });
  }

  private nameStyle() {
    return stylable('member-name', this.config, {
      alignSelf: 'center',
      fontSize: '1rem',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    });
  }

  private iconStyle() {
    return stylable('member-icon', this.config, {
      alignSelf: 'center',
      fontSize: '0.5rem',
      paddingLeft: '0.1rem',
    });
  }

  static get styles() {
    return [
      css`
        .hoverable {
          border: var(--sonos-int-border-width) solid var(--sonos-int-color);
        }
        .hoverable:hover,
        .hoverable:focus {
          color: var(--sonos-int-accent-color);
          border-color: var(--sonos-int-accent-color);
        }
        .hoverable:active {
          color: var(--primary-color);
          border-color: var(--primary-color);
        }
      `,
      sharedStyle,
    ];
  }
}
