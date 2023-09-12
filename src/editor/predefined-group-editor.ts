import { html, TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { mdiCheck, mdiDelete } from '@mdi/js';
import { BaseEditor } from './base-editor';
import { ConfigPredefinedGroup, ConfigPredefinedGroupPlayer, PredefinedGroup } from '../types';

class PredefinedGroupEditor extends BaseEditor {
  @property() index!: number;
  private predefinedGroup!: PredefinedGroup;

  protected render(): TemplateResult {
    this.config = this.store.config;
    this.hass = this.store.hass;

    this.predefinedGroup = this.store.predefinedGroups?.[this.index || 0] || {
      name: '',
      media: '',
      entities: [],
    };
    const predefinedGroupWithoutVolumes: PredefinedGroup<string> = {
      ...this.predefinedGroup,
      entities: this.predefinedGroup.entities.map((pgItem) => pgItem.player.id),
    };
    const schema = [
      {
        type: 'string',
        name: 'name',
        required: true,
      },
      {
        type: 'string',
        name: 'media',
      },
      {
        name: 'entities',
        selector: { entity: { multiple: true, filter: { integration: 'sonos', domain: 'media_player' } } },
      },
    ];
    return html`
      <h2>Add/Edit Predefined Group</h2>
      <sonos-card-editor-form
        .data=${predefinedGroupWithoutVolumes}
        .schema=${schema}
        .store=${this.store}
        .changed=${(ev: CustomEvent) => this.groupChanged(ev, this.index)}
      ></sonos-card-editor-form>
      <div>
        <h3>Volumes - will be set when players are grouped</h3>
        ${this.predefinedGroup.entities.map(({ player: { id, name }, volume }) => {
          const schema = [
            {
              type: 'integer',
              name: 'volume',
              label: `${name}${volume ? `: ${volume}` : ''}`,
              valueMin: 0,
              valueMax: 100,
            },
          ];
          return html`
            <sonos-card-editor-form
              .data=${{ volume }}
              .schema=${schema}
              .store=${this.store}
              .changed=${(ev: CustomEvent) => this.volumeChanged(ev, this.index, id)}
            ></sonos-card-editor-form>
          `;
        })}
      </div>
      <ha-control-button-group>
        <ha-control-button @click="${this.dispatchClose}">
          OK<ha-svg-icon .path=${mdiCheck} label="OK"></ha-svg-icon>
        </ha-control-button>
        ${this.predefinedGroup.name
          ? html`<ha-control-button
              @click="${() => {
                this.config.predefinedGroups = this.config.predefinedGroups?.filter((_, index) => index !== this.index);
                this.index = -1;
                this.configChanged();
                this.dispatchClose();
              }}"
            >
              Delete<ha-svg-icon .path=${mdiDelete} label="Delete"></ha-svg-icon>
            </ha-control-button>`
          : ''}
      </ha-control-button-group>
    `;
  }

  private groupChanged(ev: CustomEvent, index: number): void {
    const changed: PredefinedGroup<string> = ev.detail.value;
    const entities: ConfigPredefinedGroupPlayer[] = changed.entities.map((changedPlayerId) => {
      const existing = this.predefinedGroup.entities.find(({ player: { id } }) => {
        return id === changedPlayerId;
      });
      return existing ? { ...existing, player: existing.player.id } : { player: changedPlayerId };
    });
    const configItem: ConfigPredefinedGroup = {
      ...changed,
      entities,
    };
    let groups = this.config.predefinedGroups;
    if (!Array.isArray(groups)) {
      groups = [];
    }
    if (groups[index]) {
      groups[index] = configItem;
    } else {
      groups = [...groups, configItem];
    }
    this.config.predefinedGroups = groups;
    this.configChanged();
  }

  private volumeChanged(ev: CustomEvent, index: number, playerId: string) {
    const group = this.config.predefinedGroups?.[index];
    if (group) {
      const volume = ev.detail.value.volume;
      group.entities = group.entities
        .map((entity) => (typeof entity === 'string' ? { player: entity } : entity))
        .map((entity) => (entity.player === playerId ? { ...entity, volume } : entity));
    }
    this.configChanged();
  }
}

customElements.define('sonos-card-predefined-group-editor', PredefinedGroupEditor);
