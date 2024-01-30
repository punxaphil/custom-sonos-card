import { html, TemplateResult } from 'lit';
import { BaseEditor } from './base-editor';
import { property } from 'lit/decorators.js';

class Form extends BaseEditor {
  @property({ attribute: false }) schema!: unknown;
  @property({ attribute: false }) data!: unknown;
  @property() changed!: (ev: CustomEvent) => void;
  protected render(): TemplateResult {
    return html`
      <ha-form
        .data=${this.data || this.config}
        .schema=${this.schema}
        .computeLabel=${computeLabel}
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

export function computeLabel({ help, label, name }: { name: string; help: string; label: string }) {
  if (label) {
    return label;
  }
  let unCamelCased = name.replace(/([A-Z])/g, ' $1');
  unCamelCased = unCamelCased.charAt(0).toUpperCase() + unCamelCased.slice(1);
  return unCamelCased + (help ? ` (${help})` : '');
}

customElements.define('sonos-card-editor-form', Form);
