import { html, LitElement, TemplateResult } from 'lit';
import { CardConfig, PredefinedGroup, Section } from './types';
import { fireEvent, HomeAssistant } from 'custom-card-helpers';
import { property, state } from 'lit/decorators.js';

const GROUP_PREFIX = 'predefinedGroup_';
const ENTITIES_PREFIX = `predefinedGroupEntities_`;

class CardEditor extends LitElement {
  private config!: CardConfig;
  @property() hass!: HomeAssistant;
  @state() schema = [
    {
      type: 'multi_select',
      options: {
        player: 'Player',
        volumes: 'Volumes',
        groups: 'Groups',
        grouping: 'Grouping',
        'media browser': 'Media Browser',
      },
      name: 'sections',
      title: 'Sections',
    },

    {
      name: 'entities',
      selector: { entity: { multiple: true, filter: { integration: 'sonos', domain: 'media_player' } } },
    },
    {
      name: 'predefinedGroup_0',
      selector: { text: { multiline: false } },
    },
  ];
  public setConfig(config: CardConfig) {
    this.config = config;
  }

  protected render(): TemplateResult {
    if (!this.config.sections) {
      this.config.sections = [Section.PLAYER, Section.VOLUMES, Section.GROUPS, Section.GROUPING, Section.MEDIA_BROWSER];
    }
    const data = JSON.parse(JSON.stringify(this.config));
    delete data.predefinedGroups;
    if (Array.isArray(this.config.predefinedGroups)) {
      this.config.predefinedGroups.forEach((pg, index) => {
        let name = `${GROUP_PREFIX}${index}`;
        if (!this.schema.find((item) => item.name === name)) {
          this.schema.push({
            name: name,
            selector: { text: { multiline: false } },
          });
        }
        name = `${GROUP_PREFIX}${index}`;
        if (!this.schema.find((item) => item.name === name)) {
          this.schema.push({
            name: `${ENTITIES_PREFIX}${index}`,
            selector: { entity: { multiple: true, filter: { integration: 'sonos', domain: 'media_player' } } },
          });
        }
        data[`${GROUP_PREFIX}${index}`] = pg.name;
        data[`${ENTITIES_PREFIX}${index}`] = pg.entities;
      });
    }
    return html`
      <ha-form
        .data=${data}
        .schema=${this.schema}
        .computeLabel=${(schema: { name: string; title: string }) => schema.title || schema.name}
        .hass=${this.hass}
        @value-changed=${this.valueChanged}
      ></ha-form>
    `;
  }

  private valueChanged(ev: CustomEvent): void {
    let changed = ev.detail.value;
    const filter = Object.entries(changed).filter(
      ([key]) => key.startsWith(GROUP_PREFIX) || key.startsWith(ENTITIES_PREFIX),
    );

    for (const [key, value] of filter) {
      const index = key.split('_')[1];
      const entitiesName = `${ENTITIES_PREFIX}${index}`;

      const hasEntities = this.schema.find((item) => item.name.startsWith(entitiesName));
      if (value) {
        if (!hasEntities) {
          this.schema.push({
            name: entitiesName,
            selector: { entity: { multiple: true, filter: { integration: 'sonos', domain: 'media_player' } } },
          });
        }
      } else {
        this.schema = this.schema.filter((item) => item.name !== entitiesName);
        console.log(this.schema);
      }
    }

    const pgGroups = filter.reduce((previousValue: PredefinedGroup[], [key, value]) => {
      const index = key.split('_')[1] as unknown as number;
      if (key.startsWith(GROUP_PREFIX)) {
        previousValue[index] = { name: value as string, entities: [] };
      } else {
        previousValue[index].entities = value as string[];
      }
      return previousValue;
    }, []);
    changed = Object.entries(changed).filter(
      ([key]) => !key.startsWith(GROUP_PREFIX) && !key.startsWith(ENTITIES_PREFIX),
    );

    this.config = {
      ...this.config,
      predefinedGroups: pgGroups,
      ...changed,
    };
    fireEvent(this, 'config-changed', { config: this.config });
    this.requestUpdate();
  }
}

customElements.define('dev-sonos-card-editor', CardEditor);
