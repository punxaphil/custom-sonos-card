import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { CardConfig, Section } from '../types';
import { dispatchShowSection } from '../utils/utils';
import { mdiCastVariant, mdiHome, mdiSpeakerMultiple, mdiStarOutline, mdiTune } from '@mdi/js';
import { iconButton } from './icon-button';

const { GROUPING, GROUPS, MEDIA_BROWSER, PLAYER, VOLUMES } = Section;

class Footer extends LitElement {
  @property() config!: CardConfig;
  @property() section!: Section;

  render() {
    return html`
      ${this.sectionButton(mdiHome, PLAYER)}${this.sectionButton(mdiStarOutline, MEDIA_BROWSER)}
      ${this.sectionButton(mdiSpeakerMultiple, GROUPS)} ${this.sectionButton(mdiCastVariant, GROUPING)}
      ${this.sectionButton(mdiTune, VOLUMES)}
    `;
  }

  sectionButton(icon: string, section: Section) {
    if (!this.config.sections || this.config.sections?.indexOf(section) > -1) {
      return iconButton(icon, () => dispatchShowSection(section), {
        additionalStyle: {
          padding: '1rem',
          ...(this.section === section && {
            color: 'var(--accent-color)',
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

customElements.define('sonos-footer', Footer);
