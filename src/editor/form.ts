import { html, TemplateResult } from 'lit';
import { BaseEditor, Schema } from './base-editor';
import { property } from 'lit/decorators.js';

class Form extends BaseEditor {
  @property({ attribute: false }) schema!: Schema[];
  @property({ attribute: false }) data!: unknown;
  @property() changed!: (ev: CustomEvent) => void;
  @property() labelPrefix?: string;

  protected render(): TemplateResult {
    const schema = filterEditorSchemaOnCardType(this.schema, this.config.type);
    return html`
      <ha-form
        .data=${this.data || this.config}
        .schema=${schema}
        .computeLabel=${createComputeLabel(this.labelPrefix)}
        .hass=${this.hass}
        @value-changed=${this.changed || this.valueChanged}
      ></ha-form>
    `;
  }
  protected valueChanged(ev: CustomEvent): void {
    const changed = ev.detail.value;
    this.config = {
      ...this.config,
      ...changed,
    };
    this.configChanged();
  }
}

function createComputeLabel(prefix?: string) {
  return ({ help, label, name }: { name: string; help: string; label: string }) => {
    if (label) {
      return label;
    }
    let processedName = name;
    if (prefix && processedName.startsWith(prefix)) {
      processedName = processedName.slice(prefix.length);
      processedName = processedName.charAt(0).toLowerCase() + processedName.slice(1);
    }
    let unCamelCased = processedName.replace(/([A-Z])/g, ' $1');
    unCamelCased = unCamelCased.charAt(0).toUpperCase() + unCamelCased.slice(1);
    return unCamelCased + (help ? ` (${help})` : '');
  };
}

function filterEditorSchemaOnCardType(schema: Schema[], cardType: string) {
  return schema.filter((schema) => schema.cardType === undefined || cardType.indexOf(schema.cardType) > -1);
}

customElements.define('sonos-card-editor-form', Form);
