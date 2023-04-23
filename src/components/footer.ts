import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { CardConfig, Section } from '../types';
import { dispatchShowSection, stylable } from '../utils';
import { mdiCastVariant, mdiHome, mdiSpeakerMultiple, mdiStarOutline, mdiTune } from '@mdi/js';
import { iconButton } from './icon-button';

const { GROUPING, GROUPS, MEDIA_BROWSER, PLAYER, VOLUMES } = Section;

class Footer extends LitElement {
  @property() config!: CardConfig;
  @property() section!: Section;

  render() {
    const title = this.config.name;
    return html`
      ${title ? html`<div style="${this.titleStyle()}">${title}</div>` : html``}
      ${this.sectionButton(mdiHome, PLAYER)}${this.sectionButton(mdiStarOutline, MEDIA_BROWSER)}
      ${this.sectionButton(mdiSpeakerMultiple, GROUPS)} ${this.sectionButton(mdiCastVariant, GROUPING)}
      ${this.sectionButton(mdiTune, VOLUMES)}
    `;
  }

  private titleStyle() {
    return stylable('title', this.config, {
      margin: '0.5rem 0',
      textAlign: 'center',
      fontWeight: 'bold',
      fontSize: 'larger',
      color: 'var(--sonos-int-title-color)',
    });
  }

  sectionButton(icon: string, section: Section) {
    if (!this.config.sections || this.config.sections?.indexOf(section) > -1) {
      return iconButton(icon, () => dispatchShowSection(section), this.config, {
        additionalStyle: {
          padding: '1rem',
          ...(this.section === section && {
            color: 'var(--sonos-int-accent-color)',
          }),
        },
      });
    }
    return html``;
  }
  static get styles() {
    return css`
      :host {
        display: flex;
        justify-content: space-between;
      }
    `;
  }
}

customElements.define('dev-sonos-footer', Footer);
