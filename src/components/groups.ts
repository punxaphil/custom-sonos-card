import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { PlayerGroups } from '../types';
import { CustomSonosCard } from '../main';
import sharedStyle from '../sharedStyle';
import './group';

class Groups extends LitElement {
  @property() main!: CustomSonosCard;
  @property() groups!: PlayerGroups;
  @property() mediaPlayers!: string[];

  render() {
    const config = this.main.config;
    const stylable = this.main.stylable;
    return html`
      <div class="button-section" style="${stylable('buttonSection')}">
        <div class="title" style="${stylable('title')}">${config.groupsTitle ? config.groupsTitle : 'Groups'}</div>
        ${Object.keys(this.groups).map(
          (group) => html` <sonos-group .main=${this.main} .group=${group}></sonos-group> `,
        )}
      </div>
    `;
  }

  static get styles() {
    return [sharedStyle, css``];
  }
}

customElements.define('sonos-groups', Groups);
