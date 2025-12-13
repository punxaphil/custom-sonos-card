import { html, TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { mdiCheck, mdiDelete } from '@mdi/js';
import { BaseEditor } from './base-editor';
import { ConfigPredefinedGroupPlayer, PredefinedGroup } from '../types';

class PredefinedGroupEditor extends BaseEditor {
  @property({ type: Number }) index!: number;
  @state() predefinedGroup!: PredefinedGroup<ConfigPredefinedGroupPlayer>;

  private schema = [
    { type: 'string', name: 'name', required: true },
    { type: 'string', name: 'media' },
    { type: 'boolean', name: 'excludeItemsInEntitiesList' },
    {
      name: 'entities',
      selector: { entity: { multiple: true, filter: { domain: 'media_player' } } },
    },
  ];

  protected render(): TemplateResult {
    if (!this.predefinedGroup) {
      this.initPredefinedGroup();
    }
    return html`
      <h2>Add/Edit Predefined Group</h2>
      <sonos-card-editor-form
        .data=${this.getPredefinedGroupWithoutVolumes()}
        .schema=${this.schema}
        .config=${this.config}
        .hass=${this.hass}
        .changed=${(ev: CustomEvent) => this.groupChanged(ev)}
      ></sonos-card-editor-form>
      <div>
        <h3>Volumes - will be set when players are grouped</h3>
        ${this.predefinedGroup.entities.map(({ player, volume }) => {
          const schema = [
            {
              type: 'integer',
              name: 'volume',
              label: `${this.hass.states[player]?.attributes.friendly_name ?? ''}${volume !== undefined ? `: ${volume}` : ''}`,
              valueMin: 0,
              valueMax: 100,
            },
          ];
          return html`
            <sonos-card-editor-form
              .data=${{ volume }}
              .schema=${schema}
              .config=${this.config}
              .hass=${this.hass}
              .changed=${(ev: CustomEvent) => this.volumeChanged(ev, player)}
            ></sonos-card-editor-form>
          `;
        })}
      </div>
      <ha-control-button-group>
        <ha-control-button @click=${this.savePredefinedGroup}>
          OK<ha-svg-icon .path=${mdiCheck} label="OK"></ha-svg-icon>
        </ha-control-button>
        <ha-control-button @click=${this.deletePredefinedGroup}>
          Delete<ha-svg-icon .path=${mdiDelete} label="Delete"></ha-svg-icon>
        </ha-control-button>
      </ha-control-button-group>
    `;
  }

  private initPredefinedGroup() {
    const configPg = this.config.predefinedGroups?.[this.index || 0];
    if (configPg) {
      const entities = configPg.entities.map((entity) => {
        return typeof entity === 'string' ? { player: entity } : entity;
      });
      this.predefinedGroup = { ...configPg, entities };
    } else {
      this.predefinedGroup = { name: '', media: '', entities: [] };
    }
  }

  private getPredefinedGroupWithoutVolumes() {
    return {
      ...this.predefinedGroup,
      entities: this.predefinedGroup.entities.map((pgItem) => pgItem.player),
    };
  }

  private groupChanged(ev: CustomEvent): void {
    const changed: PredefinedGroup<string> = ev.detail.value;
    const entities: ConfigPredefinedGroupPlayer[] = changed.entities.map((changedPlayerId) => {
      const existing = this.predefinedGroup.entities.find(({ player }) => {
        return player === changedPlayerId;
      });
      return existing ?? { player: changedPlayerId };
    });
    this.predefinedGroup = {
      ...changed,
      entities,
    };
  }

  private volumeChanged(ev: CustomEvent, playerId: string) {
    const volume = ev.detail.value.volume;
    const entities = this.predefinedGroup.entities.map((entity) =>
      entity.player === playerId ? { ...entity, volume } : entity,
    );
    this.predefinedGroup = { ...this.predefinedGroup, entities };
  }

  private savePredefinedGroup() {
    let groups = this.config.predefinedGroups;
    if (!Array.isArray(groups)) {
      groups = [];
    }
    if (groups[this.index]) {
      groups[this.index] = this.predefinedGroup;
    } else {
      groups = [...groups, this.predefinedGroup];
    }
    this.config.predefinedGroups = groups;
    this.configChanged();
    this.dispatchClose();
  }

  private deletePredefinedGroup() {
    this.config.predefinedGroups = this.config.predefinedGroups?.filter((_, index) => index !== this.index);
    this.index = -1;
    this.configChanged();
    this.dispatchClose();
  }
}

customElements.define('sonos-card-predefined-group-editor', PredefinedGroupEditor);
