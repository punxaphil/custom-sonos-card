import { html, TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { mdiCheck, mdiDelete } from '@mdi/js';
import { BaseEditor } from '../base-editor';
import { PREDEFINED_GROUP_SCHEMA } from '../schema/common-schema';
import { ConfigPredefinedGroupPlayer, PredefinedGroup } from '../../types';

class PredefinedGroupEditor extends BaseEditor {
  @property({ type: Number }) index!: number;
  @state() private predefinedGroup?: PredefinedGroup<ConfigPredefinedGroupPlayer>;

  protected render(): TemplateResult {
    if (!this.predefinedGroup) this.initPredefinedGroup();
    if (!this.predefinedGroup) return html``;

    const pgWithoutVolumes = {
      ...this.predefinedGroup,
      entities: this.predefinedGroup.entities.map((e) => e.player),
    };
    return html`
      <h3>Add/Edit Predefined Group</h3>
      <sonos-card-editor-form
        .data=${pgWithoutVolumes}
        .schema=${PREDEFINED_GROUP_SCHEMA}
        .config=${this.config}
        .hass=${this.hass}
        .changed=${this.groupChanged}
      ></sonos-card-editor-form>
      <h4>Volumes - will be set when players are grouped</h4>
      ${this.predefinedGroup.entities.map(({ player, volume }) => this.renderVolumeField(player, volume))}
      <ha-control-button-group>
        <ha-control-button @click=${this.save}>OK<ha-svg-icon .path=${mdiCheck}></ha-svg-icon></ha-control-button>
        <ha-control-button @click=${this.delete}
          >Delete<ha-svg-icon .path=${mdiDelete}></ha-svg-icon
        ></ha-control-button>
      </ha-control-button-group>
    `;
  }

  private initPredefinedGroup() {
    const configPg = this.config.predefinedGroups?.[this.index];
    if (configPg) {
      const entities = configPg.entities.map((e) => (typeof e === 'string' ? { player: e } : e));
      this.predefinedGroup = { ...configPg, entities };
    } else {
      this.predefinedGroup = { name: '', media: '', entities: [] };
    }
  }

  private renderVolumeField(player: string, volume?: number) {
    const label = `${this.hass.states[player]?.attributes.friendly_name ?? player}${volume !== undefined ? `: ${volume}` : ''}`;
    const schema = [{ type: 'integer', name: 'volume', label, valueMin: 0, valueMax: 100 }];
    return html`
      <sonos-card-editor-form
        .data=${{ volume }}
        .schema=${schema}
        .config=${this.config}
        .hass=${this.hass}
        .changed=${(ev: CustomEvent) => this.volumeChanged(ev, player)}
      ></sonos-card-editor-form>
    `;
  }

  private groupChanged = (ev: CustomEvent) => {
    const changed: PredefinedGroup<string> = ev.detail.value;
    const entities: ConfigPredefinedGroupPlayer[] = changed.entities.map((id) => {
      const existing = this.predefinedGroup?.entities.find(({ player }) => player === id);
      return existing ?? { player: id };
    });
    this.predefinedGroup = { ...changed, entities };
  };

  private volumeChanged = (ev: CustomEvent, playerId: string) => {
    if (!this.predefinedGroup) return;
    const volume = ev.detail.value.volume;
    const entities = this.predefinedGroup.entities.map((e) => (e.player === playerId ? { ...e, volume } : e));
    this.predefinedGroup = { ...this.predefinedGroup, entities };
  };

  private save = () => {
    let groups = this.config.predefinedGroups ?? [];
    if (groups[this.index]) {
      groups[this.index] = this.predefinedGroup!;
    } else {
      groups = [...groups, this.predefinedGroup!];
    }
    this.config = { ...this.config, predefinedGroups: groups };
    this.configChanged();
    this.dispatchClose();
  };

  private delete = () => {
    const groups = this.config.predefinedGroups?.filter((_, i) => i !== this.index);
    this.config = { ...this.config, predefinedGroups: groups };
    this.configChanged();
    this.dispatchClose();
  };
}

customElements.define('sonos-card-predefined-group-editor', PredefinedGroupEditor);
