import { html, TemplateResult } from 'lit';
import { BaseEditor, Schema } from './base-editor';
import { property } from 'lit/decorators.js';

type SectionKey = 'player' | 'media browser' | 'groups' | 'grouping' | 'volumes' | 'queue';

class Form extends BaseEditor {
  @property({ attribute: false }) schema!: Schema[];
  @property({ attribute: false }) data!: unknown;
  @property() changed!: (ev: CustomEvent) => void;
  @property() section?: SectionKey;

  protected render(): TemplateResult {
    const schema = filterEditorSchemaOnCardType(this.schema, this.config.type);
    const data = this.section ? (this.config[this.section] ?? {}) : this.data || this.config;
    return html`
      <ha-form
        .data=${data}
        .schema=${schema}
        .computeLabel=${createComputeLabel()}
        .hass=${this.hass}
        @value-changed=${this.changed || this.handleValueChanged}
      ></ha-form>
    `;
  }

  private handleValueChanged = (ev: CustomEvent): void => {
    const changed = ev.detail.value;
    if (this.section) {
      this.config = {
        ...this.config,
        [this.section]: { ...(this.config[this.section] ?? {}), ...changed },
      };
    } else {
      this.config = { ...this.config, ...changed };
    }
    this.configChanged();
  };
}

function createComputeLabel() {
  return ({ help, label, name }: { name: string; help: string; label: string }) => {
    if (label) {
      return label;
    }
    const unCamelCased = name.replace(/([A-Z])/g, ' $1');
    const capitalized = unCamelCased.charAt(0).toUpperCase() + unCamelCased.slice(1);
    return capitalized + (help ? ` (${help})` : '');
  };
}

function filterEditorSchemaOnCardType(schema: Schema[], cardType: string) {
  return schema.filter((schema) => schema.cardType === undefined || cardType.indexOf(schema.cardType) > -1);
}

customElements.define('sonos-card-editor-form', Form);
